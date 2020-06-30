import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Application } from "../entity/applikation.entity";
import { Repository, DeleteResult } from "typeorm";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ListAllEntities } from "./dto/list-all-entities.dto";
import { ListAllApplicationsReponseDto } from "./dto/list-all-applications-response.dto";
import { UpdateApplicationDto } from "./dto/update-application.dto";

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        private applicationRepository: Repository<Application>
    ) {}

    async findAndCountWithPagination(
        query?: ListAllEntities
    ): Promise<ListAllApplicationsReponseDto> {
        const [result, total] = await this.applicationRepository.findAndCount({
            where: {},
            take: query.offset,
            skip: query.offset,
        });

        return {
            data: result,
            count: total,
        };
    }

    async findOne(id: number): Promise<Application> {
        return await this.applicationRepository.findOneOrFail(id, {
            relations: ["iotDevices"],
        });
    }

    async create(
        createApplicationDto: CreateApplicationDto
    ): Promise<Application> {
        const application = new Application();
        application.name = createApplicationDto.name;
        application.description = createApplicationDto.description;
        application.iotDevices = [];

        return this.applicationRepository.save(application);
    }

    async update(
        id: number,
        updateApplicationDto: UpdateApplicationDto
    ): Promise<Application> {
        const existingApplication = await this.applicationRepository.findOneOrFail(
            id
        );

        existingApplication.name = updateApplicationDto.name;
        existingApplication.description = updateApplicationDto.description;

        return this.applicationRepository.save(existingApplication);
    }

    async delete(id: number): Promise<DeleteResult> {
        return this.applicationRepository.delete(id);
    }
}
