import { CreateApplicationDto } from "@dto/create-application.dto";
import { CreateLoRaWANSettingsDto } from "@dto/create-lorawan-settings.dto";
import { ListAllApplicationsResponseDto } from "@dto/list-all-applications-response.dto";
import { ListAllApplicationsDto } from "@dto/list-all-applications.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllIoTDevicesResponseDto } from "@dto/list-all-iot-devices-response.dto";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { UpdateApplicationDto } from "@dto/update-application.dto";
import { ApplicationDeviceType } from "@entities/application-device-type.entity";
import { Application } from "@entities/application.entity";
import { ControlledProperty } from "@entities/controlled-property.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { ControlledPropertyTypes } from "@enum/controlled-property.enum";
import { ApplicationDeviceTypes, ApplicationDeviceTypeUnion, IoTDeviceType } from "@enum/device-type.enum";
import { ErrorCodes } from "@enum/error-codes.enum";
import { findValuesInRecord } from "@helpers/record.helper";
import { nameof } from "@helpers/type-helper";
import { ConflictException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { OrganizationService } from "@services/user-management/organization.service";
import { PermissionService } from "@services/user-management/permission.service";
import { DeleteResult, In, Repository } from "typeorm";
import { MulticastService } from "./multicast.service";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { DataTargetType } from "@enum/data-target-type.enum";

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        private applicationRepository: Repository<Application>,
        @InjectRepository(IoTDevice)
        private iotDeviceRepository: Repository<IoTDevice>,
        @Inject(forwardRef(() => OrganizationService))
        private organizationService: OrganizationService,
        private multicastService: MulticastService,
        private chirpstackDeviceService: ChirpstackDeviceService,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService,
        @Inject(forwardRef(() => DataTargetService))
        private dataTargetService: DataTargetService
    ) {}

    async findAndCountInList(
        query?: ListAllEntitiesDto,
        whitelist?: number[],
        allFromOrgs?: number[]
    ): Promise<ListAllApplicationsResponseDto> {
        const sorting = this.getSortingForApplications(query);
        const orgCondition =
            allFromOrgs != null ? { id: In(whitelist), belongsTo: In(allFromOrgs) } : { id: In(whitelist) };
        const [result, total] = await this.applicationRepository.findAndCount({
            where: orgCondition,
            take: query.limit,
            skip: query.offset,
            relations: ["iotDevices"],
            order: sorting,
        });

        return {
            data: result,
            count: total,
        };
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
            relations: ["iotDevices"],
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
            relations: ["iotDevices", "dataTargets", "controlledProperties", "deviceTypes"],
            order: sorting,
        });

        // Since openDataDkEnabled is not a database attribute sorting has to be done manually after reading
        if (query.orderOn === "openDataDkEnabled") {
            result.sort(
                (a, b) =>
                    (query.sort.toLowerCase() === "asc" ? -1 : 1) *
                    (Number(!!a.dataTargets.find(t => t.type === DataTargetType.OpenDataDK)) -
                        Number(!!b.dataTargets.find(t => t.type === DataTargetType.OpenDataDK)))
            );
        }

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
            (query.orderOn == "id" || query.orderOn == "name" || query.orderOn == "updatedAt")
        ) {
            orderBy = `application.${query.orderOn}`;
        }
        const order: "DESC" | "ASC" = query?.sort?.toLocaleUpperCase() == "DESC" ? "DESC" : "ASC";
        const [result, total] = await this.applicationRepository
            .createQueryBuilder("application")
            .innerJoin("application.permissions", "perm")
            .leftJoinAndSelect("application.iotDevices", "iotdevices")
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
                "dataTargets",
                "multicasts",
                "iotDevices.receivedMessagesMetadata",
                "belongsTo",
                nameof<Application>("controlledProperties"),
                nameof<Application>("deviceTypes"),
                "permissions",
            ],
            loadRelationIds: {
                relations: ["createdBy", "updatedBy"],
            },
        });
        if (app.iotDevices.some(x => x.type == IoTDeviceType.LoRaWAN)) {
            await this.matchWithChirpstackStatusData(app);
        }

        return app;
    }

    private async matchWithChirpstackStatusData(app: Application) {
        const allFromChirpstack = await this.chirpstackDeviceService.getAllDevicesStatus();
        app.iotDevices.forEach(x => {
            if (x.type == IoTDeviceType.LoRaWAN) {
                const loraDevice = x as LoRaWANDeviceWithChirpstackDataDto;
                const matchingDevice = allFromChirpstack.result.find(cs => cs.devEUI == loraDevice.deviceEUI);
                if (matchingDevice) {
                    loraDevice.lorawanSettings = new CreateLoRaWANSettingsDto();
                    loraDevice.lorawanSettings.deviceStatusBattery = matchingDevice.deviceStatusBattery;
                    loraDevice.lorawanSettings.deviceStatusMargin = matchingDevice.deviceStatusMargin;
                }
            }
        });
    }

    async findManyByIds(ids: number[]): Promise<Application[]> {
        if (ids == null || ids?.length == 0) {
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

        const app = await this.applicationRepository.save(mappedApplication);

        await this.permissionService.autoAddPermissionsToApplication(app);

        return app;
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

        mappedApplication.updatedBy = userId;
        return this.applicationRepository.save(mappedApplication, {});
    }

    async delete(id: number): Promise<DeleteResult> {
        const application = await this.applicationRepository.findOne({
            where: { id },
            relations: ["iotDevices", "multicasts", "dataTargets"],
        });

        // Don't allow delete if this application contains any sigfox devices.
        if (
            application.iotDevices.some(iotDevice => {
                return iotDevice.type == IoTDeviceType.SigFox;
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

            await this.multicastService.deleteMulticastChirpstack(
                dbMulticast.lorawanMulticastDefinition.chirpstackGroupId
            );
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
                    return app.id == id;
                });
            } else {
                return applicationsWithName.length == 0;
            }
        }

        return false;
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
        const direction = query?.sort?.toUpperCase() == "DESC" ? "DESC" : "ASC";

        const [data, count] = await this.iotDeviceRepository
            .createQueryBuilder("iot_device")
            .where('"iot_device"."applicationId" = :id', { id: appId })
            .leftJoinAndSelect("iot_device.latestReceivedMessage", "metadata")
            .leftJoinAndSelect("iot_device.deviceModel", "deviceModel")
            .skip(query?.offset ? +query.offset : 0)
            .take(query?.limit ? +query.limit : 100)
            .orderBy(orderByColumn, direction)
            .getManyAndCount();

        // Fetch LoRa details one by one to get battery status. The LoRa API doesn't support query by multiple deveui's to reduce the calls.
        // Reduce calls by pre-fetching service profile ids by application id. The applications is usually the same
        const loraDevices = data.filter(
            device => device.type === IoTDeviceType.LoRaWAN
        ) as LoRaWANDeviceWithChirpstackDataDto[];
        const applications = await this.chirpstackDeviceService.getLoRaWANApplications(loraDevices);
        const loraApplications = applications.map(app => app.application);

        for (const device of loraDevices) {
            await this.chirpstackDeviceService.enrichLoRaWANDevice(device, loraApplications);
        }

        return {
            data,
            count,
        };
    }

    private getSortingForIoTDevices(query: ListAllEntitiesDto) {
        let orderBy = `iot_device.id`;
        if (
            (query?.orderOn != null && query.orderOn === "id") ||
            query.orderOn === "name" ||
            query.orderOn === "active" ||
            query.orderOn === "rssi" ||
            query.orderOn === "snr"
        ) {
            if (query.orderOn === "active") {
                orderBy = `metadata.sentTime`;
            } else if (query.orderOn === "rssi" || query.orderOn === "snr") {
                orderBy = `metadata.${query.orderOn}`;
            } else {
                orderBy = `iot_device.${query.orderOn}`;
            }
        }
        return orderBy;
    }

    private getSortingForApplications(query: ListAllEntitiesDto): Record<string, string | number> {
        const sorting: Record<string, string | number> = {};
        if (
            // TODO: Make this nicer
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
            sorting[query.orderOn] = query.sort.toLocaleUpperCase();
        } else {
            sorting["id"] = "ASC";
        }
        return sorting;
    }
}
