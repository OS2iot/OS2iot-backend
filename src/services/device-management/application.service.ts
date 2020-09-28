import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { Repository, DeleteResult, In } from "typeorm";
import { CreateApplicationDto } from "@dto/create-application.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllApplicationsReponseDto } from "@dto/list-all-applications-response.dto";
import { UpdateApplicationDto } from "@dto/update-application.dto";
import { OrganizationService } from "@services/user-management/organization.service";

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        private applicationRepository: Repository<Application>,
        @Inject(forwardRef(() => OrganizationService))
        private organizationService: OrganizationService
    ) {}

    async findAndCountWithPagination(
        query?: ListAllEntitiesDto,
        allowedOrganisations?: number[]
    ): Promise<ListAllApplicationsReponseDto> {
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

    async findOne(id: number): Promise<Application> {
        return await this.applicationRepository.findOneOrFail(id, {
            relations: [
                "iotDevices",
                "dataTargets",
                "iotDevices.receivedMessagesMetadata",
                "belongsTo",
            ],
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

        return this.applicationRepository.save(mappedApplication);
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
