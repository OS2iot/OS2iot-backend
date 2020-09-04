import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { Repository, DeleteResult } from "typeorm";
import { CreateApplicationDto } from "@dto/create-application.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllApplicationsReponseDto } from "@dto/list-all-applications-response.dto";
import { UpdateApplicationDto } from "@dto/update-application.dto";

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        private applicationRepository: Repository<Application>
    ) {}

    async findAndCountWithPagination(
        query?: ListAllEntitiesDto
    ): Promise<ListAllApplicationsReponseDto> {
        const [result, total] = await this.applicationRepository.findAndCount({
            where: {},
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
            ],
        });
    }

    async create(
        createApplicationDto: CreateApplicationDto
    ): Promise<Application> {
        const application = new Application();

        const mappedApplication = this.mapApplicationDtoToApplication(
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
        const existingApplication = await this.applicationRepository.findOneOrFail(
            id,
            { relations: ["iotDevices", "dataTargets"] }
        );

        const mappedApplication = this.mapApplicationDtoToApplication(
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

    private mapApplicationDtoToApplication(
        applicationDto: CreateApplicationDto | UpdateApplicationDto,
        application: Application
    ): Application {
        application.name = applicationDto.name;
        application.description = applicationDto.description;

        return application;
    }
}
