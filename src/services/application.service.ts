import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Application } from "@entities/applikation.entity";
import { Repository, DeleteResult, getConnection } from "typeorm";
import { CreateApplicationDto } from "@dto/create/create-application.dto";
import { ListAllEntities } from "@dto/list/list-all-entities.dto";
import { ListAllApplicationsReponseDto } from "@dto/list/list-all-applications-response.dto";
import { UpdateApplicationDto } from "@dto/update/update-application.dto";
import { User } from "@entities/user.entity";

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        private applicationRepository: Repository<Application>
    ) {}

    
           
    async findAndCountWithPagination(
        query?: ListAllEntities
    ): Promise<ListAllApplicationsReponseDto> {
        const [result, total] = await getConnection()
        .createQueryBuilder()
        .select("application")
        .from(Application, "application").orderBy({id:"DESC"})
        .getManyAndCount();
        return {
            data: result,
            count: total,
        };
    }
   

    async findOneWithoutRelations(id: number): Promise<Application> {
        return await this.applicationRepository.findOneOrFail(id);
    }


    //TODO re-write Getters into this syntax 
    async findOne(id: number): Promise<Application> {
        return await getConnection()
        .createQueryBuilder()
        .select("application")
        .from(Application, "application")
        .where("application.id = :id", { id: id })
        .getOne();
    }
    async create(
        createApplicationDto: CreateApplicationDto
    ): Promise<Application> {
        const application = new Application();

        const mappedApplication = this.mapApplicationDtoToApplication(
            createApplicationDto,
            application
        );

        return this.applicationRepository.save(mappedApplication);
    }

    async update(
        id: number,
        updateApplicationDto: UpdateApplicationDto
    ): Promise<Application> {
        const existingApplication = await this.applicationRepository.findOneOrFail(
            id
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

    private mapApplicationDtoToApplication(
        applicationDto: CreateApplicationDto | UpdateApplicationDto,
        application: Application
    ): Application {
        application.name = applicationDto.name;
        application.description = applicationDto.description;
        if (
            application.iotDevices === undefined ||
            application.iotDevices === null
        ) {
            application.iotDevices = [];
        }

        return application;
    }
}
