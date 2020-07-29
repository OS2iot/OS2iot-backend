import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { Repository, DeleteResult } from "typeorm";
import { CreateApplicationDto } from "@dto/create-application.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllApplicationsReponseDto } from "@dto/list-all-applications-response.dto";
import { UpdateApplicationDto } from "@dto/update-application.dto";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaService } from "@services/kafka/kafka.service";
import { RecordMetadata } from "kafkajs";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { TransformedPayloadDto } from "../entities/dto/kafka/transformed-payload.dto";

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(Application)
        private applicationRepository: Repository<Application>,
        private readonly kafkaService: KafkaService
    ) {}

    async findAndCountWithPagination(
        query?: ListAllEntitiesDto
    ): Promise<ListAllApplicationsReponseDto> {
        const [result, total] = await this.applicationRepository.findAndCount({
            where: {},
            take: query.limit,
            skip: query.offset,
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
            relations: ["iotDevices", "dataTargets"],
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

        const message = {
            value: "Sample message",
        };
        const payload: KafkaPayload = {
            messageId: "a" + new Date().valueOf(),
            body: message,
            messageType: "Say.Hello",
            topicName: KafkaTopic.RAW_REQUEST,
        };
        const value = await this.kafkaService.sendMessage(
            KafkaTopic.RAW_REQUEST,
            payload
        );

        const dto = new TransformedPayloadDto();
        dto.iotDeviceId = 1;
        dto.payload = JSON.parse('{"test":123}');

        const payload2: KafkaPayload = {
            messageId: "b" + new Date().valueOf(),
            body: dto,
            messageType: "Say.Hello",
            topicName: KafkaTopic.TRANSFORMED_REQUEST,
        };
        const value2 = await this.kafkaService.sendMessage(
            KafkaTopic.TRANSFORMED_REQUEST,
            payload2
        );

        if (value) {
            const metadata = value as RecordMetadata[];
            Logger.log(`kafka status '${metadata[0].errorCode}'`);
        }

        if (value2) {
            const metadata = value2 as RecordMetadata[];
            Logger.log(`kafka status '${metadata[0].errorCode}'`);
        }

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
        if (
            application.iotDevices === undefined ||
            application.iotDevices === null
        ) {
            application.iotDevices = [];
        }

        return application;
    }
}
