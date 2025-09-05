import { ApplicationsWithErrorsResponseDto } from "@dto/applications-dashboard-responses";
import { CreateApplicationDto } from "@dto/create-application.dto";
import {
  ListAllApplicationsResponseDto,
  ListAllApplicationsWithStatusResponseDto,
} from "@dto/list-all-applications-response.dto";
import { ListAllApplicationsDto } from "@dto/list-all-applications.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllIoTDevicesResponseDto } from "@dto/list-all-iot-devices-response.dto";
import { IoTDevicesListToMapResponseDto } from "@dto/list-all-iot-devices-to-map-response.dto";
import { ListAllIotDevicesDto } from "@dto/list-all-iot-devices.dto";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { UpdateApplicationOrganizationDto } from "@dto/update-application-organization.dto";
import { UpdateApplicationDto } from "@dto/update-application.dto";
import { ApplicationDeviceType } from "@entities/application-device-type.entity";
import { Application } from "@entities/application.entity";
import { ControlledProperty } from "@entities/controlled-property.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { Permission } from "@entities/permissions/permission.entity";
import { ControlledPropertyTypes } from "@enum/controlled-property.enum";
import { DataTargetType } from "@enum/data-target-type.enum";
import { ApplicationDeviceTypes, ApplicationDeviceTypeUnion, IoTDeviceType } from "@enum/device-type.enum";
import { ErrorCodes } from "@enum/error-codes.enum";
import { findValuesInRecord } from "@helpers/record.helper";
import { nameof } from "@helpers/type-helper";
import { BadRequestException, ConflictException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ApplicationChirpstackService } from "@services/chirpstack/chirpstack-application.service";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { MulticastService } from "@services/chirpstack/multicast.service";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { OrganizationService } from "@services/user-management/organization.service";
import { PermissionService } from "@services/user-management/permission.service";
import { Brackets, DeleteResult, In, Repository } from "typeorm";

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(IoTDevice)
    private iotDeviceRepository: Repository<IoTDevice>,
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService,
    private multicastService: MulticastService,
    private chirpstackDeviceService: ChirpstackDeviceService,
    @Inject(forwardRef(() => PermissionService))
    private permissionService: PermissionService,
    @Inject(forwardRef(() => DataTargetService))
    private dataTargetService: DataTargetService,
    private chirpstackApplicationService: ApplicationChirpstackService
  ) {}

  async countApplicationsWithError(
    organizationId: number,
    whitelist: number[] | "admin"
  ): Promise<ApplicationsWithErrorsResponseDto> {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder("app")
      .leftJoin("app.iotDevices", "device")
      .leftJoin("app.belongsTo", "organization")
      .leftJoin("device.latestReceivedMessage", "latestMessage")
      .leftJoin("app.dataTargets", "dataTargets")
      .where("app.belongsToId = :organizationId", { organizationId: organizationId });

    if (whitelist !== "admin" && whitelist.length > 0) {
      queryBuilder.andWhere("app.id IN (:...whitelist)", { whitelist });
    }

    try {
      const totalApplications = await queryBuilder.getCount();

      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where("dataTargets.id IS NULL").orWhere("latestMessage.sentTime < NOW() - INTERVAL '24 HOURS'");
        })
      );

      const errorApplications = await queryBuilder.getCount();

      return {
        withError: errorApplications,
        total: totalApplications,
      };
    } catch (error) {
      throw new Error("Database query failed");
    }
  }

  async countAllDevices(organizationId: number, whitelist: number[] | "admin"): Promise<number> {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder("app")
      .leftJoinAndSelect("app.iotDevices", "device")
      .leftJoin("app.dataTargets", "dataTargets")
      .where("app.belongsToId = :organizationId", { organizationId });

    if (whitelist !== "admin" && whitelist.length > 0) {
      queryBuilder.andWhere("app.id IN (:...whitelist)", { whitelist });
    }

    const count = await queryBuilder.select("COUNT(DISTINCT(device.id))", "count").getRawOne();

    try {
      return count.count ? parseInt(count.count, 10) : 0;
    } catch (error) {
      throw new Error("Database query failed");
    }
  }

  async getAllDevices(
    organizationId: number,
    query?: ListAllIotDevicesDto,
    whitelist?: number[] | "admin"
  ): Promise<IoTDevice[]> {
    const queryBuilder = this.iotDeviceRepository
      .createQueryBuilder("device")
      .leftJoin("device.application", "app")
      .leftJoin("app.dataTargets", "dataTargets")
      .leftJoinAndSelect("device.latestReceivedMessage", "latestMessage")
      .addSelect(["latestMessage.id", "latestMessage.sentTime"])
      .where("app.belongsToId = :organizationId", { organizationId });

    if (whitelist !== "admin" && whitelist.length > 0) {
      queryBuilder.andWhere("app.id IN (:...whitelist)", { whitelist });
    }

    if (query.status) {
      queryBuilder.andWhere("app.status = :status", { status: query.status });
    }

    if (query.owner) {
      queryBuilder.andWhere("app.owner = :owner", { owner: query.owner });
    }

    if (query.statusCheck === "alert") {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.andWhere("dataTargets.id IS NULL").orWhere("latestMessage.sentTime < NOW() - INTERVAL '24 HOURS'");
        })
      );
    }

    if (query.statusCheck === "stable") {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where("dataTargets.id IS NOT NULL").andWhere("latestMessage.sentTime > NOW() - INTERVAL '24 HOURS'");
        })
      );
    }

    try {
      return await queryBuilder.getMany();
    } catch (error) {
      console.error("Database query failed:", error);
      throw new Error("Database query failed");
    }
  }

  async findAndCountInList(
    query?: ListAllApplicationsDto,
    whitelist?: number[]
  ): Promise<ListAllApplicationsWithStatusResponseDto> {
    const sorting = this.getSortingForApplications(query);

    const queryBuilder = this.applicationRepository
      .createQueryBuilder("app")
      .leftJoinAndSelect("app.iotDevices", "device")
      .leftJoinAndSelect("app.belongsTo", "organization")
      .leftJoinAndSelect("device.latestReceivedMessage", "latestMessage")
      .leftJoinAndSelect("app.dataTargets", "dataTargets")
      .leftJoinAndSelect("app.controlledProperties", "controlledProperties");

    if (query.organizationId) {
      queryBuilder.andWhere("app.belongsToId = :organizationId", { organizationId: query.organizationId });
    }

    if (whitelist && whitelist.length > 0) {
      queryBuilder.andWhere("app.id IN (:...whitelist)", { whitelist });
    }

    if (query.status) {
      queryBuilder.andWhere("app.status = :status", { status: query.status });
    }

    if (query.owner) {
      queryBuilder.andWhere("app.owner = :owner", { owner: query.owner });
    }

    queryBuilder.orderBy(sorting);
    queryBuilder.take(query.limit).skip(query.offset);

    try {
      const [result, total] = await queryBuilder.getManyAndCount();
      let mappedResult = result.map(app => {
        const latestMessage = app.iotDevices
          ?.map(device => device.latestReceivedMessage)
          .sort((a, b) => (a?.sentTime > b?.sentTime ? 1 : -1))
          .find(msg => msg != undefined);
        const hasDataTargets = app.dataTargets && app.dataTargets.length > 0;
        const isLatestMessageOld = latestMessage
          ? new Date(latestMessage.sentTime) < new Date(Date.now() - 24 * 60 * 60 * 1000)
          : false;

        let statusCheck: "stable" | "alert" = "stable";

        if (!hasDataTargets || isLatestMessageOld) {
          statusCheck = "alert";
        }

        return {
          ...app,
          statusCheck,
        };
      });

      if (query.statusCheck === "stable") {
        mappedResult = mappedResult.filter(a => a.statusCheck === "stable");
      } else if (query.statusCheck === "alert") {
        mappedResult = mappedResult.filter(a => a.statusCheck === "alert");
      }

      this.externalSortResult(query, mappedResult);

      return {
        data: mappedResult,
        count: total,
      };
    } catch (error) {
      throw new Error("Database query failed");
    }
  }

  async findAndCountApplicationInWhitelistOrOrganization(
    query: ListAllApplicationsDto,
    allowedApplications: number[],
    organizationIds: number[]
  ): Promise<ListAllApplicationsResponseDto> {
    const [result, total] = await this.applicationRepository.findAndCount({
      where:
        organizationIds.length > 0
          ? { id: In(allowedApplications), belongsTo: In(organizationIds) }
          : { id: In(allowedApplications) },
      take: query.limit,
      skip: query.offset,
      relations: ["iotDevices", nameof<Application>("belongsTo")],
      order: { id: query.sort },
    });

    return {
      data: result,
      count: total,
    };
  }

  async findAndCountWithPagination(
    query?: ListAllEntitiesDto,
    allowedOrganisations?: number[]
  ): Promise<ListAllApplicationsResponseDto> {
    const sorting = this.getSortingForApplications(query);
    const [result, total] = await this.applicationRepository.findAndCount({
      where: allowedOrganisations != null ? { belongsTo: In(allowedOrganisations) } : {},
      take: +query.limit,
      skip: +query.offset,
      relations: ["iotDevices", "dataTargets", "controlledProperties", "deviceTypes", nameof<Application>("belongsTo")],
      order: sorting,
    });

    this.externalSortResult(query, result);

    return {
      data: result,
      count: total,
    };
  }

  async getApplicationsOnPermissionId(
    permissionId: number,
    query: ListAllApplicationsDto
  ): Promise<ListAllApplicationsResponseDto> {
    let orderBy = `application.id`;
    if (
      query.orderOn != null &&
      (query.orderOn === "id" || query.orderOn === "name" || query.orderOn === "updatedAt")
    ) {
      orderBy = `application.${query.orderOn}`;
    }
    const order: "DESC" | "ASC" = query?.sort?.toLocaleUpperCase() === "DESC" ? "DESC" : "ASC";
    const [result, total] = await this.applicationRepository
      .createQueryBuilder("application")
      .innerJoin("application.permissions", "perm")
      .leftJoinAndSelect("application.iotDevices", "iotdevices")
      .leftJoinAndSelect("application.dataTargets", "datatargets")
      .leftJoinAndSelect("application.controlledProperties", "controlledproperties")
      .leftJoinAndSelect("application.deviceTypes", "devicetypes")
      .where("perm.id = :permId", { permId: permissionId })
      .take(+query.limit)
      .skip(+query.offset)
      .orderBy(orderBy, order)
      .getManyAndCount();

    return {
      data: result,
      count: total,
    };
  }

  async findOneWithoutRelations(id: number): Promise<Application> {
    return await this.applicationRepository.findOneByOrFail({ id });
  }

  async findOwnerFilterInformation(applicationIds: number[] | "admin", organizationId: number) {
    const query = this.applicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.belongsTo", "organization")
      .where("organization.id = :organizationId", { organizationId });

    if (applicationIds !== "admin") {
      query.where("application.id IN (:...applicationIds)", { applicationIds });
    }

    const result = await query.getMany();

    return [...new Set(result.map(app => app.owner))];
  }

  async findOneWithOrganisation(id: number): Promise<Application> {
    return await this.applicationRepository.findOneOrFail({
      where: { id },
      relations: ["belongsTo"],
    });
  }

  async findManyWithOrganisation(ids: number[]): Promise<Application[]> {
    return await this.applicationRepository.find({
      where: { id: In(ids) },
      relations: ["belongsTo"],
    });
  }

  async findOne(id: number): Promise<Application> {
    const app = await this.applicationRepository.findOneOrFail({
      where: { id },
      relations: [
        "iotDevices",
        "belongsTo",
        nameof<Application>("controlledProperties"),
        nameof<Application>("deviceTypes"),
        "permissions",
      ],
      loadRelationIds: {
        relations: ["createdBy", "updatedBy"],
      },
    });

    return app;
  }

  async findManyByIds(ids: number[]): Promise<Application[]> {
    if (ids == null || ids?.length === 0) {
      return [];
    }
    return await this.applicationRepository.findBy({ id: In(ids) });
  }

  async create(createApplicationDto: CreateApplicationDto, userId: number): Promise<Application> {
    const application = new Application();

    const mappedApplication = await this.mapApplicationDtoToApplication(createApplicationDto, application, userId);
    mappedApplication.iotDevices = [];
    mappedApplication.dataTargets = [];
    mappedApplication.multicasts = [];
    mappedApplication.createdBy = userId;
    mappedApplication.updatedBy = userId;

    try {
      mappedApplication.chirpstackId = await this.chirpstackApplicationService.createChirpstackApplication({
        application: { description: createApplicationDto.description, name: createApplicationDto.name },
      });
      const app = await this.applicationRepository.save(mappedApplication);

      return app;
    } catch (e) {
      throw new BadRequestException(ErrorCodes.InvalidPost);
    }
  }

  async update(id: number, updateApplicationDto: UpdateApplicationDto, userId: number): Promise<Application> {
    const existingApplication = await this.applicationRepository.findOneOrFail({
      where: { id },
      relations: [
        nameof<Application>("iotDevices"),
        nameof<Application>("dataTargets"),
        nameof<Application>("controlledProperties"),
        nameof<Application>("deviceTypes"),
      ],
    });

    const mappedApplication = await this.mapApplicationDtoToApplication(
      updateApplicationDto,
      existingApplication,
      userId
    );

    await this.chirpstackApplicationService.updateApplication(mappedApplication);

    mappedApplication.updatedBy = userId;
    return this.applicationRepository.save(mappedApplication, {});
  }

  async changeOrganization(
    id: number,
    updateApplicationDto: UpdateApplicationOrganizationDto,
    userId: number
  ): Promise<Application> {
    const existingApplication = await this.applicationRepository.findOneOrFail({
      where: { id },
    });

    let permissions = await this.permissionRepository.find({
      where: { id: In(updateApplicationDto.permissionIds) },
      relations: [nameof<Permission>("organization")],
    });

    const permissionOrganizationSet = new Set<number>(permissions.map(p => p.organization.id));
    let newOrganization = [...permissionOrganizationSet].length !== 1 ? undefined : permissions[0].organization;

    if (!newOrganization) {
      newOrganization = await this.organizationService.findByIdWithPermissions(updateApplicationDto.organizationId);
      permissions = newOrganization.permissions.filter(perm => perm.automaticallyAddNewApplications);
    }

    if (!newOrganization || newOrganization.id !== updateApplicationDto.organizationId) {
      throw new BadRequestException(ErrorCodes.InvalidPost);
    }

    existingApplication.permissions = permissions;
    existingApplication.belongsTo = newOrganization;

    await this.chirpstackApplicationService.updateApplication(existingApplication);

    existingApplication.updatedBy = userId;
    return this.applicationRepository.save(existingApplication, {});
  }

  async delete(id: number): Promise<DeleteResult> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ["iotDevices", "multicasts", "dataTargets"],
    });

    // Don't allow delete if this application contains any sigfox devices.
    if (
      application.iotDevices.some(iotDevice => {
        return iotDevice.type === IoTDeviceType.SigFox;
      })
    ) {
      throw new ConflictException(ErrorCodes.DeleteNotAllowedHasSigfoxDevice);
    }

    for (const dataTarget of application.dataTargets) {
      await this.dataTargetService.delete(dataTarget.id);
    }

    // Delete all LoRaWAN devices in ChirpStack
    const loRaWANDevices = application.iotDevices.filter(device => device.type === IoTDeviceType.LoRaWAN);

    for (const device of loRaWANDevices) {
      const lwDevice = device as LoRaWANDevice;
      await this.chirpstackDeviceService.deleteDevice(lwDevice.deviceEUI);
    }

    //delete all multicats
    const multicasts = application.multicasts;
    for (const multicast of multicasts) {
      const dbMulticast = await this.multicastService.findOne(multicast.id);

      await this.multicastService.deleteMulticastChirpstack(dbMulticast.lorawanMulticastDefinition.chirpstackGroupId);
    }
    if (application.chirpstackId) {
      await this.chirpstackApplicationService.deleteApplication(application.chirpstackId);
    }

    return this.applicationRepository.delete(id);
  }

  async isNameValidAndNotUsed(name: string, id?: number): Promise<boolean> {
    if (name) {
      const applicationsWithName = await this.applicationRepository.findBy({
        name,
      });

      if (id) {
        // If id is given then this id is allowed to have the name already (i.e. it's being changed)
        return applicationsWithName.every(app => {
          return app.id === id;
        });
      } else {
        return applicationsWithName.length === 0;
      }
    }

    return false;
  }

  buildControlledPropertyDeviceType<
    T extends Record<string, string>,
    Entity extends ControlledProperty | ApplicationDeviceType
  >(validKeys: T, clientTypes: string[], userId: number, entity: { new (): Entity }): Entity[] {
    // Filter out invalid client values
    const matchingValues = findValuesInRecord(validKeys, clientTypes);

    return matchingValues.map(type => {
      const newEntity = new entity();
      newEntity.createdBy = userId;
      newEntity.updatedBy = userId;
      newEntity.type = type as ControlledPropertyTypes | ApplicationDeviceTypeUnion;

      return newEntity;
    });
  }

  async findDevicesForApplication(appId: number, query: ListAllEntitiesDto): Promise<ListAllIoTDevicesResponseDto> {
    const orderByColumn = this.getSortingForIoTDevices(query);
    const direction = query?.sort?.toUpperCase() === "DESC" ? "DESC" : "ASC";
    const nullsOrder = query?.sort?.toUpperCase() === "DESC" ? "NULLS LAST" : "NULLS FIRST";

    const [data, count] = await this.iotDeviceRepository
      .createQueryBuilder("iot_device")
      .where('"iot_device"."applicationId" = :id', { id: appId })
      .leftJoinAndSelect("iot_device.latestReceivedMessage", "metadata")
      .leftJoinAndSelect("iot_device.deviceModel", "deviceModel")
      .leftJoinAndSelect("iot_device.connections", "connections")
      .skip(query?.offset ? +query.offset : 0)
      .take(query?.limit ? +query.limit : 100)
      .orderBy(orderByColumn, direction, nullsOrder)
      .getManyAndCount();

    if (query.orderOn === "dataTargets") {
      data.sort(
        (a, b) => (query.sort.toLowerCase() === "asc" ? 1 : -1) * (a.connections.length - b.connections.length)
      );
    }

    // Fetch LoRa details one by one to get battery status. The LoRa API doesn't support query by multiple deveui's to reduce the calls.
    // Reduce calls by pre-fetching service profile ids by application id. The applications is usually the same
    // TODO: Remove
    const loraDevices = data.filter(
      device => device.type === IoTDeviceType.LoRaWAN
    ) as LoRaWANDeviceWithChirpstackDataDto[];

    for (const device of loraDevices) {
      try {
        await this.chirpstackDeviceService.enrichLoRaWANDevice(device);
      } catch {
        // ignored
      }
    }

    return {
      data,
      count,
    };
  }

  async findDevicesForApplicationMap(appId: number): Promise<IoTDevicesListToMapResponseDto[]> {
    const [data] = await this.iotDeviceRepository
      .createQueryBuilder("iot_device")
      .where('"iot_device"."applicationId" = :id', { id: appId })
      .leftJoinAndSelect("iot_device.latestReceivedMessage", "metadata")
      .getManyAndCount();

    const deviceList: IoTDevicesListToMapResponseDto[] = data.map(device => {
      return {
        id: device.id,
        name: device.name,
        type: device.type,
        latestSentMessage: device.latestReceivedMessage?.sentTime,
        location: device.location,
      };
    });

    return deviceList;
  }

  public async getFilterInformationInOrganization(
    allowedOrganizations: number[],
    organizationId: number,
    isGlobalAdmin: boolean
  ) {
    if (isGlobalAdmin || allowedOrganizations.some(x => x === organizationId)) {
      return await this.findOwnerFilterInformation("admin", organizationId);
    }

    return await this.findOwnerFilterInformation(allowedOrganizations, organizationId);
  }

  // Some sorting fields can't be done in the database
  private externalSortResult(query: ListAllEntitiesDto, result: Application[]) {
    // Since openDataDkEnabled is not a database attribute sorting has to be done manually after reading
    if (query.orderOn === "openDataDkEnabled") {
      result.sort(
        (a, b) =>
          (query.sort.toLowerCase() === "asc" ? -1 : 1) *
          (Number(!!a.dataTargets.find(t => t.type === DataTargetType.OpenDataDK)) -
            Number(!!b.dataTargets.find(t => t.type === DataTargetType.OpenDataDK)))
      );
    }
    if (query.orderOn === "devices") {
      result.sort(
        (a, b) => (query.sort.toLowerCase() === "asc" ? 1 : -1) * (a.iotDevices.length - b.iotDevices.length)
      );
    }
    if (query.orderOn === "dataTargets") {
      result.sort(
        (a, b) => (query.sort.toLowerCase() === "asc" ? 1 : -1) * (a.dataTargets.length - b.dataTargets.length)
      );
    }
  }

  private async mapApplicationDtoToApplication(
    applicationDto: CreateApplicationDto | UpdateApplicationDto,
    application: Application,
    userId: number
  ): Promise<Application> {
    application.name = applicationDto.name;
    application.description = applicationDto.description;
    application.belongsTo = await this.organizationService.findById(applicationDto.organizationId);
    application.status = applicationDto.status;
    // Setting a date to 'undefined' will set it to today in the database
    application.startDate = applicationDto.startDate ?? null;
    application.endDate = applicationDto.endDate ?? null;
    application.category = applicationDto.category;
    application.owner = applicationDto.owner;
    application.contactPerson = applicationDto.contactPerson;
    application.contactEmail = applicationDto.contactEmail;
    application.contactPhone = applicationDto.contactPhone;
    application.personalData = applicationDto.personalData;
    application.hardware = applicationDto.hardware;
    application.permissions = await this.permissionService.findManyByIds(applicationDto.permissionIds);

    // Set metadata dependencies
    application.controlledProperties = applicationDto.controlledProperties
      ? this.buildControlledPropertyDeviceType(
          ControlledPropertyTypes,
          applicationDto.controlledProperties,
          userId,
          ControlledProperty
        )
      : undefined;
    application.deviceTypes = applicationDto.deviceTypes
      ? this.buildControlledPropertyDeviceType(
          ApplicationDeviceTypes,
          applicationDto.deviceTypes,
          userId,
          ApplicationDeviceType
        )
      : undefined;

    return application;
  }

  private getSortingForIoTDevices(query: ListAllEntitiesDto) {
    let orderBy = `iot_device.id`;
    if (
      (query?.orderOn != null && query.orderOn === "id") ||
      query.orderOn === "name" ||
      query.orderOn === "active" ||
      query.orderOn === "rssi" ||
      query.orderOn === "snr" ||
      query.orderOn === "deviceModel" ||
      query.orderOn === "dataTargets" ||
      query.orderOn === "commentOnLocation"
    ) {
      if (query.orderOn === "active") {
        orderBy = `metadata.sentTime`;
      } else if (query.orderOn === "rssi" || query.orderOn === "snr") {
        orderBy = `metadata.${query.orderOn}`;
      } else if (query.orderOn === "deviceModel") {
        orderBy = "deviceModel.body";
      } else if (query.orderOn === "dataTargets") {
        orderBy = "connections.id";
      } else {
        orderBy = `iot_device.${query.orderOn}`;
      }
    }
    return orderBy;
  }

  private getSortingForApplications(query: ListAllEntitiesDto): Record<string, "ASC" | "DESC"> {
    const sorting: Record<string, "ASC" | "DESC"> = {};

    if (
      query.orderOn != null &&
      (query.orderOn === "id" ||
        query.orderOn === "name" ||
        query.orderOn === "updatedAt" ||
        query.orderOn === "status" ||
        query.orderOn === "startDate" ||
        query.orderOn === "endDate" ||
        query.orderOn === "owner" ||
        query.orderOn === "contactPerson" ||
        query.orderOn === "personalData")
    ) {
      const sortOrder = query.sort.toUpperCase() === "DESC" ? "DESC" : "ASC";

      sorting[`app.${query.orderOn}`] = sortOrder;
    }

    if (Object.keys(sorting).length === 0) {
      sorting["app.id"] = "ASC";
    }

    return sorting;
  }
}
