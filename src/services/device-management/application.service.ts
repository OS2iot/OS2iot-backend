import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, In, Repository } from "typeorm";

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
        const [result, total] = await this.applicationRepository.findAndCount({
            where:
                allowedOrganisations != null
                    ? { belongsTo: In(allowedOrganisations) }
                    : {},
            take: query.limit,
            skip: query.offset,
            relations: ["iotDevices"],
            order: { id: query.sort }, // TODO: Generic sorting possible?
        });

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
                "iotDevices.receivedMessagesMetadata",
                "belongsTo",
            ],
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

    async create(createApplicationDto: CreateApplicationDto): Promise<Application> {
        const application = new Application();

        const mappedApplication = await this.mapApplicationDtoToApplication(
            createApplicationDto,
            application
        );
        mappedApplication.iotDevices = [];
        mappedApplication.dataTargets = [];

        const app = await this.applicationRepository.save(mappedApplication);

        await this.permissionService.autoAddPermissionsToApplication(app);

        return app;
    }

    async update(
        id: number,
        updateApplicationDto: UpdateApplicationDto
    ): Promise<Application> {
        const existingApplication = await this.applicationRepository.findOneOrFail(id, {
            relations: ["iotDevices", "dataTargets"],
        });

        const mappedApplication = await this.mapApplicationDtoToApplication(
            updateApplicationDto,
            existingApplication
        );

        return this.applicationRepository.save(mappedApplication);
    }

    async delete(id: number): Promise<DeleteResult> {
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
}
