import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { RawRequestDto } from "@dto/kafka/raw-request.dto";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDevice } from "@entities/iot-device.entity";

@Injectable()
export class DeviceIntegrationPersistenceService extends AbstractKafkaConsumer {
    constructor(
        @InjectRepository(ReceivedMessage)
        private receivedMessageRepository: Repository<ReceivedMessage>,
        @InjectRepository(ReceivedMessageMetadata)
        private receivedMessageMetadataRepository: Repository<ReceivedMessageMetadata>,
        private ioTDeviceService: IoTDeviceService
    ) {
        super();
    }

    private readonly logger = new Logger(DeviceIntegrationPersistenceService.name);

    protected registerTopic(): void {
        this.addTopic(KafkaTopic.RAW_REQUEST, "DeviceIntegrationPersistence");
    }

    // Listen to Kafka event
    @CombinedSubscribeTo(KafkaTopic.RAW_REQUEST, "DeviceIntegrationPersistence")
    async rawRequestListener(payload: KafkaPayload): Promise<void> {
        this.logger.debug(`RAW_REQUEST: '${JSON.stringify(payload)}'`);
        const dto: RawRequestDto = payload.body;
        let relatedIoTDevice;
        try {
            relatedIoTDevice = await this.ioTDeviceService.findOne(dto.iotDeviceId);
        } catch (err) {
            this.logger.error(`Could not find IoTDevice by ID: ${dto.iotDeviceId}`);
            return;
        }

        // Save latest message
        await this.saveLatestMessage(dto, relatedIoTDevice);

        // Save last X messages worth of metadata
        await this.saveMessageMetadata(dto, relatedIoTDevice);
    }

    private async saveLatestMessage(
        dto: RawRequestDto,
        relatedIoTDevice: IoTDevice
    ): Promise<void> {
        let existingMessage = await this.findExistingRecevedMessage(relatedIoTDevice);

        if (existingMessage) {
            this.logger.debug(
                `There was already a ReceivedMessage for device with id: ${dto.iotDeviceId}. Will be overwritten.`
            );
        } else {
            existingMessage = new ReceivedMessage();
        }

        const mappedMessage = this.mapDtoToReceivedMessage(
            dto,
            existingMessage,
            relatedIoTDevice
        );
        await this.receivedMessageRepository.save(mappedMessage);
        this.logger.debug(
            "Saved ReceivedMessage for device with id: " + mappedMessage.device.id
        );
    }

    private async findExistingRecevedMessage(
        relatedIoTDevice: IoTDevice
    ): Promise<ReceivedMessage> {
        // Use QueryBuilder since the relation only exists from IoT-Device to ReceivedMessage
        return await this.receivedMessageRepository
            .createQueryBuilder("msg")
            .leftJoinAndSelect("msg.device", "iot_device")
            .where("iot_device.id = :id", { id: relatedIoTDevice.id })
            .getOne();
    }

    mapDtoToReceivedMessage(
        dto: RawRequestDto,
        existingMessage: ReceivedMessage,
        relatedIoTDevice: IoTDevice
    ): ReceivedMessage {
        existingMessage.device = relatedIoTDevice;
        existingMessage.rawData = dto.rawPayload;
        existingMessage.sentTime = dto.unixTimestamp
            ? new Date(dto.unixTimestamp)
            : new Date();

        return existingMessage;
    }

    private async saveMessageMetadata(
        dto: RawRequestDto,
        relatedIoTDevice: IoTDevice
    ): Promise<void> {
        // Save this
        const mappedMetadata = this.mapDtoToNewReceivedMessageMetadata(
            dto,
            relatedIoTDevice
        );
        const savedMetadata = await this.receivedMessageMetadataRepository.save(
            mappedMetadata
        );
        this.logger.debug(
            `Saved ReceivedMessageMetadata for device: ${
                savedMetadata.device.id
            }. ${JSON.stringify(savedMetadata)}`
        );

        await this.deleteOldMetadata(relatedIoTDevice);
    }

    private async deleteOldMetadata(relatedIoTDevice: IoTDevice): Promise<void> {
        const countToKeep: number = +process.env.METADATA_SAVED_COUNT || 10;
        // Find the oldest item to be kept.
        const newestToDelete = await this.receivedMessageMetadataRepository.find({
            where: { device: { id: relatedIoTDevice.id } },
            skip: countToKeep,
            order: {
                sentTime: "DESC",
            },
        });

        if (newestToDelete.length == 0) {
            this.logger.debug("We don't need to delete any metadata");
            return;
        }

        // Delete all older than X
        await this.doDeleteOldMetadata(relatedIoTDevice, newestToDelete);
    }

    private async doDeleteOldMetadata(
        relatedIoTDevice: IoTDevice,
        newestToDelete: ReceivedMessageMetadata[]
    ) {
        const result = await this.receivedMessageMetadataRepository
            .createQueryBuilder("received_message_metadata")
            .delete()
            .from(ReceivedMessageMetadata)
            .where(
                'received_message_metadata."deviceId" = :deviceId and received_message_metadata."sentTime" <= :earliestToKeep',
                {
                    deviceId: relatedIoTDevice.id,
                    earliestToKeep: newestToDelete[0].sentTime,
                }
            )
            .execute();
        this.logger.debug(
            `Deleted: ${result.affected} rows from received_message_metadata`
        );
    }

    mapDtoToNewReceivedMessageMetadata(
        dto: RawRequestDto,
        relatedIoTDevice: IoTDevice
    ): ReceivedMessageMetadata {
        const newMetadata = new ReceivedMessageMetadata();
        newMetadata.device = relatedIoTDevice;
        newMetadata.sentTime = dto.unixTimestamp
            ? new Date(dto.unixTimestamp)
            : new Date();

        return newMetadata;
    }
}
