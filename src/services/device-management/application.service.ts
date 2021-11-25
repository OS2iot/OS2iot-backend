import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { Inject, Injectable, forwardRef, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, getManager, In, QueryBuilder, Repository } from "typeorm";
import { CreateApplicationDto } from "@dto/create-application.dto";
import { ListAllApplicationsResponseDto } from "@dto/list-all-applications-response.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { UpdateApplicationDto } from "@dto/update-application.dto";
import { Application } from "@entities/application.entity";
import { OrganizationService } from "@services/user-management/organization.service";
import { ListAllApplicationsDto } from "@dto/list-all-applications.dto";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { IoTDeviceType } from "@enum/device-type.enum";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { CreateLoRaWANSettingsDto } from "@dto/create-lorawan-settings.dto";
import { PermissionService } from "@services/user-management/permission.service";
import { ErrorCodes } from "@enum/error-codes.enum";
import { IoTDevice } from "@entities/iot-device.entity";
import { ListAllIoTDevicesResponseDto } from "@dto/list-all-iot-devices-response.dto";

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        private applicationRepository: Repository<Application>,
        @Inject(forwardRef(() => OrganizationService))
        private organizationService: OrganizationService,
        private chirpstackDeviceService: ChirpstackDeviceService,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService
    ) {}

    async findAndCountInList(
        query?: ListAllEntitiesDto,
        whitelist?: number[],
        allFromOrgs?: number[]
    ): Promise<ListAllApplicationsResponseDto> {
        const orgCondition =
            allFromOrgs != null
                ? { id: In(whitelist), belongsTo: In(allFromOrgs) }
                : { id: In(whitelist) };
        const [result, total] = await this.applicationRepository.findAndCount({
            where: orgCondition,
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

    async findAndCountApplicationInWhitelistOrOrganization(
        query: ListAllApplicationsDto,
        allowedApplications: number[],
        organizationIds: number[]
    ): Promise<ListAllApplicationsResponseDto> {
        const [result, total] = await this.applicationRepository.findAndCount({
            where:
                organizationIds.length > 0
                    ? [
                          { id: In(allowedApplications) },
                          { belongsTo: In(organizationIds) },
                      ]
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
        const sorting: { [id: string]: string | number } = {};
        if (
            query.orderOn != null &&
            (query.orderOn == "id" ||
                query.orderOn == "name" ||
                query.orderOn == "updatedAt")
        ) {
            sorting[query.orderOn] = query.sort.toLocaleUpperCase();
        } else {
            sorting["id"] = "ASC";
        }
        const [result, total] = await this.applicationRepository.findAndCount({
            where:
                allowedOrganisations != null
                    ? { belongsTo: In(allowedOrganisations) }
                    : {},
            take: +query.limit,
            skip: +query.offset,
            relations: ["iotDevices"],
            order: sorting,
        });

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
            (query.orderOn == "id" ||
                query.orderOn == "name" ||
                query.orderOn == "updatedAt")
        ) {
            orderBy = `application.${query.orderOn}`;
        }
        const order: "DESC" | "ASC" =
            query?.sort?.toLocaleUpperCase() == "DESC" ? "DESC" : "ASC";
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
        return await this.applicationRepository.findOneOrFail(id);
    }

    async findOneWithOrganisation(id: number): Promise<Application> {
        return await this.applicationRepository.findOneOrFail(id, {
            relations: ["belongsTo"],
        });
    }

    async findOne(id: number): Promise<Application> {
        const app = await this.applicationRepository.findOneOrFail(id, {
            relations: [
                "iotDevices",
                "dataTargets",
                "multicasts",
                "iotDevices.receivedMessagesMetadata",
                "belongsTo",
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
                const matchingDevice = allFromChirpstack.result.find(
                    cs => cs.devEUI == loraDevice.deviceEUI
                );
                if (matchingDevice) {
                    loraDevice.lorawanSettings = new CreateLoRaWANSettingsDto();
                    loraDevice.lorawanSettings.deviceStatusBattery =
                        matchingDevice.deviceStatusBattery;
                    loraDevice.lorawanSettings.deviceStatusMargin =
                        matchingDevice.deviceStatusMargin;
                }
            }
        });
    }

    async findManyByIds(ids: number[]): Promise<Application[]> {
        if (ids == null || ids?.length == 0) {
            return [];
        }
        return await this.applicationRepository.find({ id: In(ids) });
    }

    async create(
        createApplicationDto: CreateApplicationDto,
        userId: number
    ): Promise<Application> {
        const application = new Application();

        const mappedApplication = await this.mapApplicationDtoToApplication(
            createApplicationDto,
            application
        );
        mappedApplication.iotDevices = [];
        mappedApplication.dataTargets = [];
        mappedApplication.multicasts = [];
        mappedApplication.createdBy = userId;
        mappedApplication.updatedBy = userId;
        const app = await this.applicationRepository.save(mappedApplication);

        await this.permissionService.autoAddPermissionsToApplication(app);

        return app;
    }

    async update(
        id: number,
        updateApplicationDto: UpdateApplicationDto,
        userId: number
    ): Promise<Application> {
        const existingApplication = await this.applicationRepository.findOneOrFail(id, {
            relations: ["iotDevices", "dataTargets"],
        });

        const mappedApplication = await this.mapApplicationDtoToApplication(
            updateApplicationDto,
            existingApplication
        );

        mappedApplication.updatedBy = userId;
        return this.applicationRepository.save(mappedApplication);
    }

    async delete(id: number): Promise<DeleteResult> {
        const application = await this.applicationRepository.findOne({
            where: { id: id },
            relations: ["iotDevices"],
        });

        // Don't allow delete if this application contains any sigfox devices.
        if (
            application.iotDevices.some(iotDevice => {
                return iotDevice.type == IoTDeviceType.SigFox;
            })
        ) {
            throw new ConflictException(ErrorCodes.DeleteNotAllowedHasSigfoxDevice);
        }

        // Delete all LoRaWAN devices in ChirpStack
        const loRaWANDevices = application.iotDevices.filter(
            device => device.type === IoTDeviceType.LoRaWAN
        );

        for (const device of loRaWANDevices) {
            const lwDevice = device as LoRaWANDevice;
            await this.chirpstackDeviceService.deleteDevice(lwDevice.deviceEUI);
        }

        return this.applicationRepository.delete(id);
    }

    async isNameValidAndNotUsed(name: string, id?: number): Promise<boolean> {
        if (name) {
            const applicationsWithName = await this.applicationRepository.find({
                name: name,
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
        application: Application
    ): Promise<Application> {
        application.name = applicationDto.name;
        application.description = applicationDto.description;
        application.belongsTo = await this.organizationService.findById(
            applicationDto.organizationId
        );

        return application;
    }

    async findDevicesForApplication(
        appId: number,
        query: ListAllEntitiesDto
    ): Promise<ListAllIoTDevicesResponseDto> {
        const orderByColumn = this.getSortingForIoTDevices(query);
        const direction = query?.sort?.toUpperCase() == "DESC" ? "DESC" : "ASC";

        const [data, count] = await getManager()
            .createQueryBuilder(IoTDevice, "iot_device")
            .where('"iot_device"."applicationId" = :id', { id: appId })
            .leftJoinAndSelect("iot_device.receivedMessagesMetadata", "metadata")
            .skip(query?.offset ? +query.offset : 0)
            .take(query?.limit ? +query.limit : 100)
            .orderBy(orderByColumn, direction)
            .getManyAndCount();

        // Need to get LoRa details to get battery status ...
        await Promise.all(
            data.map(async x => {
                if (x.type == IoTDeviceType.LoRaWAN) {
                    x = await this.chirpstackDeviceService.enrichLoRaWANDevice(x);
                }
            })
        );

        return {
            data: data,
            count: count,
        };
    }

    private getSortingForIoTDevices(query: ListAllEntitiesDto) {
        let orderBy = `iot_device.id`;
        if (
            (query?.orderOn != null && query.orderOn == "id") ||
            query.orderOn == "name" ||
            query.orderOn == "active"
        ) {
            if (query.orderOn == "active") {
                orderBy = `metadata.sentTime`;
            } else {
                orderBy = `iot_device.${query.orderOn}`;
            }
        }
        return orderBy;
    }
}
