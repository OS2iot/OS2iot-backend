import {
  CreateGatewayRequest,
  DeleteGatewayRequest,
  Gateway as ChirpstackGateway,
  GetGatewayMetricsRequest,
  GetGatewayMetricsResponse,
  GetGatewayRequest,
  GetGatewayResponse,
  ListGatewaysRequest,
  ListGatewaysResponse,
  UpdateGatewayRequest,
} from "@chirpstack/chirpstack-api/api/gateway_pb";
import { Aggregation, AggregationMap, Location } from "@chirpstack/chirpstack-api/common/common_pb";
import { ChirpstackErrorResponseDto } from "@dto/chirpstack/chirpstack-error-response.dto";
import { ChirpstackResponseStatus } from "@dto/chirpstack/chirpstack-response.dto";
import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";
import { CreateGatewayDto } from "@dto/chirpstack/create-gateway.dto";
import { GatewayContentsDto } from "@dto/chirpstack/gateway-contents.dto";
import { ChirpstackGatewayResponseDto, GatewayResponseDto } from "@dto/chirpstack/gateway-response.dto";
import { GatewayStatsElementDto } from "@dto/chirpstack/gateway-stats.response.dto";
import {
  ListAllChirpstackGatewaysResponseDto,
  ListAllGatewaysResponseDto,
} from "@dto/chirpstack/list-all-gateways-response.dto";
import { SingleGatewayResponseDto } from "@dto/chirpstack/single-gateway-response.dto";
import {
  UpdateGatewayContentsDto,
  UpdateGatewayDto,
  UpdateGatewayOrganizationDto,
} from "@dto/chirpstack/update-gateway.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { Gateway as DbGateway } from "@entities/gateway.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { dateToTimestamp, timestampToDate } from "@helpers/date.helper";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { nameof } from "@helpers/type-helper";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { OS2IoTMail } from "@services/os2iot-mail.service";
import { OrganizationService } from "@services/user-management/organization.service";
import * as dayjs from "dayjs";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { Repository } from "typeorm";

@Injectable()
export class ChirpstackGatewayService extends GenericChirpstackConfigurationService {
  GATEWAY_STATS_INTERVAL_IN_DAYS = 29;
  GATEWAY_LAST_ACTIVE_SINCE_IN_MINUTES = 3;
  private readonly logger = new Logger(ChirpstackGatewayService.name, {
    timestamp: true,
  });

  constructor(
    @InjectRepository(DbGateway)
    private gatewayRepository: Repository<DbGateway>,
    private organizationService: OrganizationService,
    private oS2IoTMail: OS2IoTMail,
    private configService: ConfigService
  ) {
    super();
  }

  async createNewGateway(dto: CreateGatewayDto, userId: number): Promise<ChirpstackResponseStatus> {
    dto.gateway = await this.updateDtoContents(dto.gateway);

    dto.gateway.tags = this.addOrganizationToTags(dto);
    dto.gateway.tags = this.addUserToTags(dto, userId);

    const gateway = this.mapContentsDtoToGateway(dto.gateway);
    gateway.createdBy = userId;
    gateway.updatedBy = userId;
    gateway.rxPacketsReceived = 0;
    gateway.txPacketsEmitted = 0;

    gateway.organization = await this.organizationService.findById(dto.organizationId);

    const req = new CreateGatewayRequest();
    const chirpstackLocation = this.mapToChirpstackLocation(dto);

    const gatewayChirpstack = await this.mapToChirpstackGateway(dto, chirpstackLocation);
    Object.entries(dto.gateway.tags).forEach(([key, value]) => {
      gatewayChirpstack.getTagsMap().set(key, value.toString());
    });

    req.setGateway(gatewayChirpstack);

    const getGatewayRequest = new GetGatewayRequest();
    getGatewayRequest.setGatewayId(gateway.gatewayId);
    const existingGateway = await this.get<GetGatewayResponse>("gateways", this.gatewayClient, getGatewayRequest).catch(
      () => undefined
    );

    if (existingGateway)
      throw new BadRequestException({
        data: { message: "object already exists" },
      });

    try {
      await this.post("gateways", this.gatewayClient, req);
      await this.gatewayRepository.save(gateway);
      return { success: true };
    } catch (e) {
      this.logger.error(`Error from Chirpstack: '${JSON.stringify(dto)}', got response: ${JSON.stringify(e)}`);
      throw new BadRequestException({
        success: false,
        error: e,
      });
    }
  }

  async mapToChirpstackGateway(dto: CreateGatewayDto | UpdateGatewayDto, location: Location, gatewayId?: string) {
    const gateway = new ChirpstackGateway();
    gateway.setGatewayId(gatewayId ? gatewayId.toLowerCase() : dto.gateway.gatewayId);
    gateway.setDescription(dto.gateway.description);
    gateway.setName(dto.gateway.name);
    gateway.setLocation(location);
    gateway.setStatsInterval(30);
    gateway.setTenantId(dto.gateway.tenantId ? dto.gateway.tenantId : await this.getDefaultOrganizationId());

    return gateway;
  }
  mapToChirpstackLocation(dto: CreateGatewayDto | UpdateGatewayDto) {
    const location = new Location();
    location.setAccuracy(dto.gateway.location.accuracy);
    location.setAltitude(dto.gateway.location.altitude);
    location.setLatitude(dto.gateway.location.latitude);
    location.setLongitude(dto.gateway.location.longitude);
    location.setSource(dto.gateway.location.source);

    return location;
  }

  addUserToTags(dto: CreateGatewayDto, userId: number): { [id: string]: string } {
    const tags = dto.gateway.tags;
    tags[this.CREATED_BY_KEY] = `${userId}`;
    tags[this.UPDATED_BY_KEY] = `${userId}`;
    return tags;
  }

  updateUpdatedByTag(dto: UpdateGatewayDto, userId: number): { [id: string]: string } {
    const tags = dto.gateway.tags;
    tags[this.UPDATED_BY_KEY] = `${userId}`;
    return tags;
  }

  addOrganizationToTags(dto: CreateGatewayDto): { [id: string]: string } {
    const tags = dto.gateway.tags;
    tags[this.ORG_ID_KEY] = `${dto.organizationId}`;
    return tags;
  }

  async getAllWithUnusualPackagesAlarms(): Promise<ListAllGatewaysResponseDto> {
    const gateways = await this.gatewayRepository.find({
      where: { notifyUnusualPackages: true },
      relations: ["organization"],
    });
    return {
      resultList: gateways.map(gateway => this.mapGatewayToResponseDto(gateway)),
      totalCount: gateways.length,
    };
  }

  async getAll(organizationId?: number): Promise<ListAllGatewaysResponseDto> {
    let query = this.gatewayRepository
      .createQueryBuilder("gateway")
      .innerJoinAndSelect("gateway.organization", "organization");

    if (organizationId) {
      query = query.where('"organizationId" = :organizationId', { organizationId });
    }

    const gateways = await query.getMany();

    return {
      resultList: gateways.map(gateway => this.mapGatewayToResponseDto(gateway)),
      totalCount: gateways.length,
    };
  }

  public async getWithPaginationAndSorting(
    queryParams?: ListAllEntitiesDto,
    organizationId?: number
  ): Promise<ListAllGatewaysResponseDto> {
    const orderByColumn = this.getSortingForGateways(queryParams);
    const direction = queryParams?.sort?.toUpperCase() === "DESC" ? "DESC" : "ASC";
    const nullsOrder = queryParams?.sort?.toUpperCase() === "DESC" ? "NULLS LAST" : "NULLS FIRST";

    let query = this.gatewayRepository
      .createQueryBuilder("gateway")
      .innerJoinAndSelect("gateway.organization", "organization")
      .skip(queryParams?.offset ? +queryParams.offset : 0)
      .take(queryParams.limit ? +queryParams.limit : 100)
      .orderBy(orderByColumn, direction, nullsOrder);

    if (organizationId) {
      query = query.where('"organizationId" = :organizationId', { organizationId });
    }

    const [gateways, count] = await query.getManyAndCount();

    return {
      resultList: gateways.map(gateway => this.mapGatewayToResponseDto(gateway)),
      totalCount: count,
    };
  }

  public async getForMaps(organizationId?: number): Promise<ListAllGatewaysResponseDto> {
    let query = this.gatewayRepository
      .createQueryBuilder("gateway")
      .innerJoinAndSelect("gateway.organization", "organization")
      .select([
        "gateway.location",
        "gateway.name",
        "gateway.lastSeenAt",
        "gateway.id",
        "gateway.gatewayId",
        "organization.name",
        "organization.id",
      ]);

    if (organizationId) {
      query = query.where('"organizationId" = :organizationId', { organizationId });
    }

    const [gateways, count] = await query.getManyAndCount();

    return {
      resultList: gateways.map(gateway => this.mapGatewayToResponseDto(gateway, true)),
      totalCount: count,
    };
  }

  async getOne(gatewayId: string): Promise<SingleGatewayResponseDto> {
    if (gatewayId?.length != 16) {
      throw new BadRequestException("Invalid gateway id");
    }
    gatewayId = gatewayId.toLowerCase();
    try {
      const result = new SingleGatewayResponseDto();
      const gateway = await this.gatewayRepository.findOne({
        where: { gatewayId },
        relations: { organization: true },
        loadRelationIds: {
          relations: ["createdBy", "updatedBy"],
        },
      });
      const now = new Date();
      const statsFrom = new Date(new Date().setDate(now.getDate() - this.GATEWAY_STATS_INTERVAL_IN_DAYS));

      result.stats = await this.getGatewayStats(gatewayId, statsFrom, now, Aggregation.DAY);
      result.gateway = this.mapGatewayToResponseDto(gateway);

      return result;
    } catch (err) {
      this.logger.error(`Tried to find gateway with id: '${gatewayId}', got an error: ${JSON.stringify(err)}`);
      if (err?.message == "object does not exist") {
        throw new NotFoundException(ErrorCodes.IdDoesNotExists);
      }
      throw new InternalServerErrorException(err?.response?.data);
    }
  }

  async getGatewayStats(
    gatewayId: string,
    from: Date,
    to: Date,
    aggregation: AggregationMap[keyof AggregationMap]
  ): Promise<GatewayStatsElementDto[]> {
    const to_time = dateToTimestamp(to);
    const from_time_timestamp: Timestamp = dateToTimestamp(from);

    const request = new GetGatewayMetricsRequest();
    request.setGatewayId(gatewayId.toLowerCase());
    request.setStart(from_time_timestamp);
    request.setEnd(to_time);
    request.setAggregation(aggregation);

    const metaData = this.makeMetadataHeader();

    const getGatewayMetricsPromise = new Promise<GetGatewayMetricsResponse>((resolve, reject) => {
      this.gatewayClient.getMetrics(request, metaData, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
    try {
      const metrics = await getGatewayMetricsPromise;
      return this.mapPackets(metrics);
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async modifyGateway(
    gatewayId: string,
    dto: UpdateGatewayDto,
    req: AuthenticatedRequest
  ): Promise<ChirpstackResponseStatus> {
    gatewayId = gatewayId.toLowerCase();
    dto.gateway = await this.updateDtoContents(dto.gateway);
    dto.gateway.tags = await this.ensureOrganizationIdIsSet(gatewayId, dto, req);
    dto.gateway.tags = this.updateUpdatedByTag(dto, +req.user.userId);

    const gateway = this.mapContentsDtoToGateway(dto.gateway);
    gateway.gatewayId = gatewayId;
    gateway.updatedBy = req.user.userId;

    const request = new UpdateGatewayRequest();
    const location = this.mapToChirpstackLocation(dto);

    const gatewayCs = await this.mapToChirpstackGateway(dto, location, gatewayId);

    Object.entries(dto.gateway.tags).forEach(([key, value]) => {
      gatewayCs.getTagsMap().set(key, value.toString());
    });

    request.setGateway(gatewayCs);
    try {
      await this.gatewayRepository.update({ gatewayId }, gateway);
      await this.put("gateways", this.gatewayClient, request).catch(
        async () => await this.post("gateways", this.gatewayClient, request)
      );
      return { success: true };
    } catch (e) {
      this.logger.error(`Error from Chirpstack: '${JSON.stringify(dto)}', got response: ${JSON.stringify(e)}`);
      throw new BadRequestException({
        success: false,
        error: e,
      });
    }
  }

  async changeOrganization(gatewayId: number, dto: UpdateGatewayOrganizationDto): Promise<DbGateway> {
    const gateway = await this.gatewayRepository.findOne({
      where: { id: gatewayId },
      relations: [nameof<DbGateway>("organization")],
    });

    const organization = await this.organizationService.findById(dto.organizationId);
    gateway.organization = organization;
    return await this.gatewayRepository.save(gateway);
  }

  public async updateGatewayStats(
    gatewayId: string,
    rxPacketsReceived: number,
    txPacketsEmitted: number,
    updatedAt: Date,
    lastSeenAt: Date | undefined
  ) {
    await this.gatewayRepository.update(
      { gatewayId: gatewayId.toLowerCase() },
      { rxPacketsReceived, txPacketsEmitted, lastSeenAt, updatedAt }
    );
  }

  async ensureOrganizationIdIsSet(
    gatewayId: string,
    dto: UpdateGatewayDto,
    req: AuthenticatedRequest
  ): Promise<{ [id: string]: string }> {
    const existing = await this.getOne(gatewayId.toLowerCase());
    const tags = dto.gateway.tags;
    tags[this.ORG_ID_KEY] = `${existing.gateway.organizationId}`;
    // TODO: Interpolated string will never be null?
    if (tags[this.ORG_ID_KEY] != null) {
      checkIfUserHasAccessToOrganization(req, +tags[this.ORG_ID_KEY], OrganizationAccessScope.GatewayWrite);
    }
    return tags;
  }

  async deleteGateway(gatewayId: string): Promise<ChirpstackResponseStatus> {
    const req = new DeleteGatewayRequest();
    gatewayId = gatewayId.toLowerCase();
    req.setGatewayId(gatewayId);
    try {
      await this.gatewayRepository.delete({ gatewayId });
      await this.delete("gateways", this.gatewayClient, req);
      return {
        success: true,
      };
    } catch (err) {
      this.logger.error(`Got error from Chirpstack: ${JSON.stringify(err?.response?.data)}`);
      return {
        success: false,
        chirpstackError: err?.response?.data as ChirpstackErrorResponseDto,
      };
    }
  }

  public mapContentsDtoToGateway(dto: GatewayContentsDto) {
    const gateway = new DbGateway();
    gateway.name = dto.name;
    gateway.gatewayId = dto.gatewayId;
    gateway.description = dto.description;
    gateway.altitude = dto.location.altitude;
    gateway.location = {
      type: "Point",
      coordinates: [dto.location.longitude, dto.location.latitude],
    };

    gateway.placement = dto.placement;
    gateway.modelName = dto.modelName;
    gateway.antennaType = dto.antennaType;
    gateway.status = dto.status;
    gateway.gatewayResponsibleName = dto.gatewayResponsibleName;
    gateway.gatewayResponsibleEmail = dto.gatewayResponsibleEmail;
    gateway.gatewayResponsiblePhoneNumber = dto.gatewayResponsiblePhoneNumber;
    gateway.operationalResponsibleName = dto.operationalResponsibleName;
    gateway.operationalResponsibleEmail = dto.operationalResponsibleEmail;
    gateway.alarmMail = dto.alarmMail;
    gateway.notifyOffline = dto.notifyOffline;
    gateway.notifyUnusualPackages = dto.notifyUnusualPackages;
    gateway.offlineAlarmThresholdMinutes = dto.offlineAlarmThresholdMinutes;
    gateway.minimumPackages = dto.minimumPackages;
    gateway.maximumPackages = dto.maximumPackages;

    const tempTags = { ...dto.tags };
    tempTags[this.ORG_ID_KEY] = undefined;
    tempTags[this.CREATED_BY_KEY] = undefined;
    tempTags[this.UPDATED_BY_KEY] = undefined;
    gateway.tags = JSON.stringify(tempTags);

    return gateway;
  }

  public mapChirpstackGatewayToDatabaseGateway(chirpstackGateway: ChirpstackGateway, gwResponse: GetGatewayResponse) {
    const gateway = new DbGateway();
    gateway.name = chirpstackGateway.getName();
    gateway.gatewayId = chirpstackGateway.getGatewayId();
    gateway.description = chirpstackGateway.getDescription();
    gateway.altitude = chirpstackGateway.getLocation().getAltitude();
    gateway.location = {
      type: "Point",
      coordinates: [chirpstackGateway.getLocation().getLongitude(), chirpstackGateway.getLocation().getLatitude()],
    };
    const jsonRepresentation: Record<string, string> = chirpstackGateway
      .getTagsMap()
      .toArray()
      .reduce((obj: Record<string, string>, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    jsonRepresentation["internalOrganizationId"] = undefined;
    jsonRepresentation["os2iot-updated-by"] = undefined;
    jsonRepresentation["os2iot-created-by"] = undefined;
    gateway.tags = JSON.stringify(jsonRepresentation);
    gateway.lastSeenAt = gwResponse.getLastSeenAt()
      ? timestampToDate(gwResponse.getLastSeenAt().toObject())
      : undefined;
    gateway.createdAt = gwResponse.getCreatedAt() ? timestampToDate(gwResponse.getCreatedAt().toObject()) : undefined;
    gateway.updatedAt = gwResponse.getUpdatedAt() ? timestampToDate(gwResponse.getUpdatedAt().toObject()) : undefined;
    gateway.rxPacketsReceived = 0;
    gateway.txPacketsEmitted = 0;
    gateway.createdBy =
      chirpstackGateway.getTagsMap().get("os2iot-created-by") !== undefined
        ? Number(chirpstackGateway.getTagsMap().get("os2iot-created-by"))
        : undefined;
    gateway.updatedBy =
      chirpstackGateway.getTagsMap().get("os2iot-updated-by") !== undefined
        ? Number(chirpstackGateway.getTagsMap().get("os2iot-updated-by"))
        : undefined;

    return gateway;
  }

  async getAllGatewaysFromChirpstack(): Promise<ListAllChirpstackGatewaysResponseDto> {
    const limit = 1000;
    const listReq = new ListGatewaysRequest();
    // Get all chirpstack gateways
    const chirpStackGateways = await this.getAllWithPagination<ListGatewaysResponse.AsObject>(
      "gateways",
      this.gatewayClient,
      listReq,
      limit,
      0
    );

    const responseItem: ChirpstackGatewayResponseDto[] = [];
    chirpStackGateways.resultList.map(e => {
      const resultItem: ChirpstackGatewayResponseDto = {
        gatewayId: e.gatewayId,
        name: e.name,
        location: e.location,
        description: e.description,
        createdAt: e.createdAt ?? undefined,
        updatedAt: e.updatedAt ?? undefined,
        lastSeenAt: e.lastSeenAt ?? undefined,
      };
      responseItem.push(resultItem);
    });
    const responseList: ListAllChirpstackGatewaysResponseDto = {
      totalCount: chirpStackGateways.totalCount,
      resultList: responseItem,
    };
    return responseList;
  }

  validatePackageAlarmInput(dto: UpdateGatewayDto) {
    if (dto.gateway.minimumPackages > dto.gateway.maximumPackages) {
      throw new BadRequestException({
        success: false,
        error: "Minimum has to be under maximum, and maximum has to be over minimum",
      });
    }
  }

  async checkForAlarms(gateways: GatewayResponseDto[]) {
    for (let index = 0; index < gateways.length; index++) {
      if (gateways[index].notifyOffline) {
        await this.checkForNotificationOfflineAlarms(gateways[index]);
      }
    }
  }

  async checkForUnusualPackagesAlarms(gateways: GatewayResponseDto[]) {
    for (let index = 0; index < gateways.length; index++) {
      await this.checkForNotificationUnusualPackagesAlarms(gateways[index]);
    }
  }

  //TODO: This could be moved to a helper function in the future, since it has a lot of similarities with metrics from chirpstack devices.
  private mapPackets(metrics: GetGatewayMetricsResponse) {
    const gatewayResponseDto: GatewayStatsElementDto[] = [];
    const packetCounts: { [timestamp: string]: { rx: number; tx: number } } = {};

    const rxTimestamps = metrics.getRxPackets().getTimestampsList();
    const rxPackets = metrics
      .getRxPackets()
      .getDatasetsList()
      .find(e => e.getLabel() === "rx_count")
      .getDataList();

    this.processPackets(rxTimestamps, rxPackets, "rx", packetCounts);

    const txTimestamps = metrics.getTxPackets().getTimestampsList();
    const txPackets = metrics
      .getTxPackets()
      .getDatasetsList()
      .find(e => e.getLabel() === "tx_count")
      .getDataList();

    this.processPackets(txTimestamps, txPackets, "tx", packetCounts);

    Object.keys(packetCounts).forEach(timestamp => {
      const packetCount = packetCounts[timestamp];
      const dto: GatewayStatsElementDto = {
        timestamp,
        rxPacketsReceived: packetCount.rx,
        txPacketsEmitted: packetCount.tx,
      };
      gatewayResponseDto.push(dto);
    });
    return gatewayResponseDto;
  }

  private processPackets(
    timestamps: Array<Timestamp>,
    packets: number[],
    key: string,
    packetCounts: { [timestamp: string]: { rx: number; tx: number } }
  ) {
    timestamps.forEach((timestamp, index) => {
      const isoTimestamp = timestamp.toDate().toISOString();
      packetCounts[isoTimestamp] = packetCounts[isoTimestamp] || { rx: 0, tx: 0 };
      (packetCounts[isoTimestamp] as any)[key] = packets[index];
    });
  }

  private async updateDtoContents(
    contentsDto: GatewayContentsDto | UpdateGatewayContentsDto
  ): Promise<GatewayContentsDto | UpdateGatewayContentsDto> {
    if (contentsDto?.tagsString) {
      contentsDto.tags = JSON.parse(contentsDto.tagsString);
    } else {
      contentsDto.tags = {};
    }

    contentsDto.id = contentsDto.gatewayId;

    return contentsDto;
  }

  private mapGatewayToResponseDto(gateway: DbGateway, forMap = false): GatewayResponseDto {
    const responseDto = gateway as unknown as GatewayResponseDto;
    responseDto.organizationId = gateway.organization.id;
    responseDto.organizationName = gateway.organization.name;

    const commonLocation = new CommonLocationDto();
    commonLocation.latitude = gateway.location.coordinates[1];
    commonLocation.longitude = gateway.location.coordinates[0];

    if (!forMap) {
      commonLocation.altitude = gateway.altitude;
      responseDto.tags = JSON.parse(gateway.tags);
    }

    responseDto.location = commonLocation;

    return responseDto;
  }

  private getSortingForGateways(query: ListAllEntitiesDto) {
    let orderBy = "gateway.id";

    if (!query.orderOn) {
      return orderBy;
    }

    if (query.orderOn === "organizationName") {
      orderBy = "organization.name";
    } else if (query.orderOn === "status") {
      orderBy = "gateway.lastSeenAt";
    } else {
      orderBy = `gateway.${query.orderOn}`;
    }

    return orderBy;
  }

  private async checkForNotificationUnusualPackagesAlarms(gateway: GatewayResponseDto) {
    if (!gateway.lastSeenAt) {
      return;
    }

    const dayBeforeToTime = new Date();
    dayBeforeToTime.setDate(dayBeforeToTime.getDate() - 1);

    const gatewayStats = await this.getGatewayStats(
      gateway.gatewayId,
      dayBeforeToTime,
      dayBeforeToTime,
      Aggregation.DAY
    );

    const receivedPackages = gatewayStats[0].rxPacketsReceived;

    if (gateway.minimumPackages <= receivedPackages && receivedPackages <= gateway.maximumPackages) {
      return;
    }

    await this.sendEmailForUnusualPackages(gateway, receivedPackages);
  }

  private async checkForNotificationOfflineAlarms(gateway: GatewayResponseDto) {
    const currentDate = dayjs();
    const lastSeen = dayjs(gateway.lastSeenAt);
    if (
      currentDate.diff(lastSeen, "minute") >= gateway.offlineAlarmThresholdMinutes &&
      !gateway.hasSentOfflineNotification
    ) {
      await this.sendEmailForNotificationOffline(gateway);
      await this.gatewayRepository.update({ gatewayId: gateway.gatewayId }, { hasSentOfflineNotification: true });
    } else if (
      gateway.hasSentOfflineNotification &&
      currentDate.diff(lastSeen, "minute") <= this.GATEWAY_LAST_ACTIVE_SINCE_IN_MINUTES
    ) {
      await this.sendEmailForNotificationOnlineAgain(gateway);
      await this.gatewayRepository.update({ gatewayId: gateway.gatewayId }, { hasSentOfflineNotification: false });
    }
  }

  private async sendEmailForNotificationOnlineAgain(gateway: GatewayResponseDto) {
    await this.oS2IoTMail.sendMail({
      to: gateway.alarmMail,
      subject: `OS2iot alarm: ${gateway.name} er online igen`,
      html: `<p>OS2iot alarm</p>
               <p>Gateway’en ${gateway.name} er kommet online igen ${gateway.lastSeenAt.toLocaleString("da-DK", {
        timeZone: "Europe/Copenhagen",
      })}.</p>
               <p>Der udsendes besked igen, hvis gateway’en går offline i det angivne tidsrum.</p>
               <p>Link: <a href="${this.configService.get<string>("frontend.baseurl")}/gateways/gateway-detail/${
        gateway.gatewayId
      }">${this.configService.get<string>("frontend.baseurl")}/gateways/gateway-detail/${gateway.gatewayId}</a></p>`,
    });
  }

  private async sendEmailForNotificationOffline(gateway: GatewayResponseDto) {
    await this.oS2IoTMail.sendMail({
      to: gateway.alarmMail,
      subject: `OS2iot alarm: ${gateway.name} er offline`,
      html: `<p>OS2iot alarm</p>
               <p>Gateway’en ${gateway.name} er offline.</p>
               <p>Der udsendes først besked igen, når gateway’en kommer online.</p>
               <p>Link: <a href="${this.configService.get<string>("frontend.baseurl")}/gateways/gateway-detail/${
        gateway.gatewayId
      }">${this.configService.get<string>("frontend.baseurl")}/gateways/gateway-detail/${gateway.gatewayId}</a></p>
              `,
    });
  }

  private async sendEmailForUnusualPackages(gateway: GatewayResponseDto, receivedPackages: number) {
    await this.oS2IoTMail.sendMail({
      to: gateway.alarmMail,
      subject: `OS2iot alarm: ${gateway.name} har et uregelmæssigt pakkemønster`,
      html: `<p>OS2iot alarm</p>
             <p>Gateway’en ${gateway.name} har et uregelmæssigt pakkemønster.</p>
             <p>Antal modtagne pakker det seneste døgn: ${receivedPackages}</p>
             <p>Der udsendes besked hvert døgn indtil pakkemønsteret igen er regelmæssigt.</p>
             <p>Link: <a href="${this.configService.get<string>("frontend.baseurl")}/gateways/gateway-detail/${
        gateway.gatewayId
      }">${this.configService.get<string>("frontend.baseurl")}/gateways/gateway-detail/${gateway.gatewayId}</a></p>`,
    });
  }
}
