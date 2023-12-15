import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { ChirpstackErrorResponseDto } from "@dto/chirpstack/chirpstack-error-response.dto";
import { ChirpstackResponseStatus } from "@dto/chirpstack/chirpstack-response.dto";
import { CreateGatewayDto } from "@dto/chirpstack/create-gateway.dto";
import { GatewayStatsElementDto } from "@dto/chirpstack/gateway-stats.response.dto";
import {
    ListAllChirpstackGatewaysResponseDto,
    ListAllGatewaysResponseDto,
} from "@dto/chirpstack/list-all-gateways.dto";
import { SingleGatewayResponseDto } from "@dto/chirpstack/single-gateway-response.dto";
import { UpdateGatewayContentsDto, UpdateGatewayDto } from "@dto/chirpstack/update-gateway.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { GatewayContentsDto } from "@dto/chirpstack/gateway-contents.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { InjectRepository } from "@nestjs/typeorm";
import { Gateway as DbGateway } from "@entities/gateway.entity";
import { Repository } from "typeorm";
import { OrganizationService } from "@services/user-management/organization.service";
import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";
import {
    CreateGatewayRequest,
    DeleteGatewayRequest,
    Gateway as ChirpstackGateway,
    GetGatewayMetricsRequest,
    GetGatewayMetricsResponse,
    GetGatewayResponse,
    ListGatewaysRequest,
    UpdateGatewayRequest,
    ListGatewaysResponse,
} from "@chirpstack/chirpstack-api/api/gateway_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { Aggregation, Location } from "@chirpstack/chirpstack-api/common/common_pb";
import { dateToTimestamp, timestampToDate } from "@helpers/date.helper";
import { ChirpstackGatewayResponseDto, GatewayResponseDto } from "@dto/chirpstack/gateway-response.dto";
@Injectable()
export class ChirpstackGatewayService extends GenericChirpstackConfigurationService {
    constructor(
        @InjectRepository(DbGateway)
        private gatewayRepository: Repository<DbGateway>,
        private organizationService: OrganizationService
    ) {
        super();
    }
    GATEWAY_STATS_INTERVAL_IN_DAYS = 29;
    private readonly logger = new Logger(ChirpstackGatewayService.name, {
        timestamp: true,
    });

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
            gatewayChirpstack.getTagsMap().set(key, value);
        });

        req.setGateway(gatewayChirpstack);
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
        gateway.setGatewayId(gatewayId ? gatewayId : dto.gateway.gatewayId);
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

    async getAll(organizationId?: number): Promise<ListAllGatewaysResponseDto> {
        let query = this.gatewayRepository
            .createQueryBuilder("gateway")
            .innerJoinAndSelect("gateway.organization", "organization");

        if (organizationId) {
            query = query.where('"organizationId" = :organizationId', { organizationId });
        }

        const gateways = await query.getMany();

        return {
            resultList: gateways.map(this.mapGatewayToResponseDto),
            totalCount: gateways.length,
        };
    }

    async getOne(gatewayId: string): Promise<SingleGatewayResponseDto> {
        if (gatewayId?.length != 16) {
            throw new BadRequestException("Invalid gateway id");
        }
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

            result.stats = await this.getGatewayStats(gatewayId, statsFrom, now);
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

    async getGatewayStats(gatewayId: string, from: Date, to: Date): Promise<GatewayStatsElementDto[]> {
        const to_time = dateToTimestamp(to);
        const from_time_timestamp: Timestamp = dateToTimestamp(from);

        const request = new GetGatewayMetricsRequest();
        request.setGatewayId(gatewayId);
        request.setStart(from_time_timestamp);
        request.setEnd(to_time);
        request.setAggregation(Aggregation.DAY);

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

    async modifyGateway(
        gatewayId: string,
        dto: UpdateGatewayDto,
        req: AuthenticatedRequest
    ): Promise<ChirpstackResponseStatus> {
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
            gatewayCs.getTagsMap().set(key, value);
        });

        request.setGateway(gatewayCs);
        try {
            await this.put("gateways", this.gatewayClient, request);
            await this.gatewayRepository.update({ gatewayId }, gateway);
            return { success: true };
        } catch (e) {
            this.logger.error(`Error from Chirpstack: '${JSON.stringify(dto)}', got response: ${JSON.stringify(e)}`);
            throw new BadRequestException({
                success: false,
                error: e,
            });
        }
    }

    public async updateGatewayStats(
        gatewayId: string,
        rxPacketsReceived: number,
        txPacketsEmitted: number,
        lastSeenAt: Date | undefined
    ) {
        await this.gatewayRepository.update({ gatewayId }, { rxPacketsReceived, txPacketsEmitted, lastSeenAt });
    }

    async ensureOrganizationIdIsSet(
        gatewayId: string,
        dto: UpdateGatewayDto,
        req: AuthenticatedRequest
    ): Promise<{ [id: string]: string }> {
        const existing = await this.getOne(gatewayId);
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
        req.setGatewayId(gatewayId);
        try {
            await this.delete("gateways", this.gatewayClient, req);
            await this.gatewayRepository.delete({ gatewayId });
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

    private async updateDtoContents(
        contentsDto: GatewayContentsDto | UpdateGatewayContentsDto
    ): Promise<GatewayContentsDto | UpdateGatewayContentsDto> {
        if (contentsDto?.tagsString) {
            contentsDto.tags = JSON.parse(contentsDto.tagsString);
        }

        contentsDto.id = contentsDto.gatewayId;

        return contentsDto;
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
            coordinates: [
                chirpstackGateway.getLocation().getLongitude(),
                chirpstackGateway.getLocation().getLatitude(),
            ],
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
        gateway.createdAt = gwResponse.getCreatedAt()
            ? timestampToDate(gwResponse.getCreatedAt().toObject())
            : undefined;
        gateway.updatedAt = gwResponse.getUpdatedAt()
            ? timestampToDate(gwResponse.getUpdatedAt().toObject())
            : undefined;
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
    private mapGatewayToResponseDto(gateway: DbGateway): GatewayResponseDto {
        const responseDto = gateway as unknown as GatewayResponseDto;
        responseDto.organizationId = gateway.organization.id;
        responseDto.organizationName = gateway.organization.name;

        const commonLocation = new CommonLocationDto();
        commonLocation.latitude = gateway.location.coordinates[1];
        commonLocation.longitude = gateway.location.coordinates[0];
        commonLocation.altitude = gateway.altitude;
        responseDto.tags = JSON.parse(gateway.tags);
        responseDto.location = commonLocation;

        return responseDto;
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
}
