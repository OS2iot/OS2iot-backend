import { RawIoTDeviceRequestDto } from "@dto/kafka/raw-iot-device-request.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata.entity";
import { ReceivedMessageSigFoxSignals } from "@entities/received-message-sigfox-signals.entity";
import { ReceivedMessage } from "@entities/received-message.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { subtractHours, subtractYears } from "@helpers/date.helper";
import { isValidLoRaWANPayload, isValidSigFoxPayload } from "@helpers/message-payload.helper";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { LessThan, MoreThan, Repository } from "typeorm";

@Injectable()
export class DeviceIntegrationPersistenceService extends AbstractKafkaConsumer {
    constructor(
        @InjectRepository(ReceivedMessage)
        private receivedMessageRepository: Repository<ReceivedMessage>,
        @InjectRepository(ReceivedMessageMetadata)
        private receivedMessageMetadataRepository: Repository<ReceivedMessageMetadata>,
        private ioTDeviceService: IoTDeviceService,
        @InjectRepository(ReceivedMessageSigFoxSignals)
        private receivedMessageSigFoxSignalsRepository: Repository<ReceivedMessageSigFoxSignals>
    ) {
        super();
    }

    private readonly logger = new Logger(DeviceIntegrationPersistenceService.name);
    private readonly defaultMetadataSavedCount = 20;
    /**
     * Limit how many messages can be stored within a time period. At the time,
     * this limit is set conservatively.
     *
     * As SigFox is limited to 140 messages/day, this should be plenty
     */
    private readonly maxSigFoxSignalsMessagesPerHour = 10;

    protected registerTopic(): void {
        this.addTopic(KafkaTopic.RAW_REQUEST, "DeviceIntegrationPersistence");
    }

    // Listen to Kafka event
    @CombinedSubscribeTo(KafkaTopic.RAW_REQUEST, "DeviceIntegrationPersistence")
    async rawRequestListener(payload: KafkaPayload): Promise<void> {
        this.logger.debug(`RAW_REQUEST: '${JSON.stringify(payload)}'`);
        const dto = payload.body as RawIoTDeviceRequestDto;
        let relatedIoTDevice;
        try {
            relatedIoTDevice = await this.ioTDeviceService.findOne(dto.iotDeviceId);
        } catch (err) {
            this.logger.error(`Could not find IoTDevice by ID: ${dto.iotDeviceId}`);
            return;
        }

        // Save latest message
        const latestMessage = await this.saveLatestMessage(dto, relatedIoTDevice);

        // Save last X messages worth of metadata
        await this.saveMessageMetadata(dto, relatedIoTDevice);

        // In order to make statistics on SigFox data, we need to store it for long-term
        if (relatedIoTDevice.type === IoTDeviceType.SigFox) {
            await this.saveSigFoxStats(latestMessage);
            await this.deleteSigFoxStatsSinceLastHour(latestMessage.sentTime, relatedIoTDevice.id);
            await this.deleteOldSigFoxStats(relatedIoTDevice.id);
        }
    }

    private async saveLatestMessage(
        dto: RawIoTDeviceRequestDto,
        relatedIoTDevice: IoTDevice
    ): Promise<ReceivedMessage> {
        let existingMessage = await this.findExistingRecevedMessage(relatedIoTDevice);

        if (existingMessage) {
            this.logger.debug(
                `There was already a ReceivedMessage for device with id: ${dto.iotDeviceId}. Will be overwritten.`
            );
        } else {
            existingMessage = new ReceivedMessage();
        }

        const mappedMessage = this.mapDtoToReceivedMessage(dto, existingMessage, relatedIoTDevice);
        await this.receivedMessageRepository.save(mappedMessage);
        this.logger.debug("Saved ReceivedMessage for device with id: " + mappedMessage.device.id);

        return mappedMessage;
    }

    private async findExistingRecevedMessage(relatedIoTDevice: IoTDevice): Promise<ReceivedMessage> {
        // Use QueryBuilder since the relation only exists from IoT-Device to ReceivedMessage
        return await this.receivedMessageRepository
            .createQueryBuilder("msg")
            .leftJoinAndSelect("msg.device", "iot_device")
            .where("iot_device.id = :id", { id: relatedIoTDevice.id })
            .getOne();
    }

    mapDtoToReceivedMessage(
        dto: RawIoTDeviceRequestDto,
        existingMessage: ReceivedMessage,
        relatedIoTDevice: IoTDevice
    ): ReceivedMessage {
        existingMessage.device = relatedIoTDevice;
        existingMessage.rawData = dto.rawPayload;
        existingMessage.sentTime = dto.unixTimestamp ? new Date(dto.unixTimestamp) : new Date();

        this.mapRxInfoToReceivedMessage(dto.rawPayload, existingMessage, relatedIoTDevice.type);

        return existingMessage;
    }

    private mapRxInfoToReceivedMessage(rawPayload: JSON, message: ReceivedMessage, type: IoTDeviceType) {
        if (!rawPayload) {
            return;
        }

        // JSON is the same as a Record<string, unknown> which is easier to work with
        const rawPayloadRecord = rawPayload as unknown as Record<string, unknown>;

        try {
            switch (type) {
                case IoTDeviceType.LoRaWAN:
                    this.mapLoRaWANInfoToReceivedMessage(rawPayloadRecord, message);
                    break;
                case IoTDeviceType.SigFox:
                    this.mapSigFoxInfoToReceivedMessage(rawPayloadRecord, message);
                    break;
                case IoTDeviceType.GenericHttp:
                    break;
                default:
                    this.logger.debug("Unable to determine raw payload type of ReceivedMessage");
                    break;
            }
        } catch (error) {
            // Continue. Failing to pre-fill device-specifc fields doesn't matter
        }
    }

    private mapLoRaWANInfoToReceivedMessage(payload: Record<string, unknown>, message: ReceivedMessage) {
        if (isValidLoRaWANPayload(payload)) {
            // There's signal info for each nearby gateway. Retrieve the strongest signal strength
            const rssi = Math.max(...payload.rxInfo.map(info => info.rssi));
            const snr = Math.max(...payload.rxInfo.map(info => info.snr));
            message.rssi = Number.isInteger(rssi) ? rssi : message.rssi;
            message.snr = Number.isInteger(snr) ? snr : message.snr;
        } else {
            this.logger.debug("The received LoRaWAN message is either not valid or incomplete");
        }
    }

    /**
     * Same principle as {@link mapLoRaWANInfoToReceivedMessage}
     */
    private mapSigFoxInfoToReceivedMessage(payload: Record<string, unknown>, message: ReceivedMessage) {
        if (isValidSigFoxPayload(payload)) {
            const rssi = Math.max(...payload.duplicates.map(info => info.rssi));
            const snr = Math.max(...payload.duplicates.map(info => info.snr));
            message.rssi = Number.isInteger(rssi) ? rssi : message.rssi;
            message.snr = Number.isInteger(snr) ? snr : message.snr;
        } else {
            this.logger.debug("The received Sigfox message is either not valid or incomplete");
        }
    }

    private async saveMessageMetadata(dto: RawIoTDeviceRequestDto, relatedIoTDevice: IoTDevice): Promise<void> {
        // Save this
        const mappedMetadata = this.mapDtoToNewReceivedMessageMetadata(dto, relatedIoTDevice);
        const savedMetadata = await this.receivedMessageMetadataRepository.save(mappedMetadata);
        this.logger.debug(
            `Saved ReceivedMessageMetadata for device: ${savedMetadata.device.id}. ${JSON.stringify(savedMetadata)}`
        );

        await this.deleteOldMetadata(relatedIoTDevice);
    }

    private async deleteOldMetadata(relatedIoTDevice: IoTDevice): Promise<void> {
        const countToKeep: number = +process.env.METADATA_SAVED_COUNT || this.defaultMetadataSavedCount;
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

    private async doDeleteOldMetadata(relatedIoTDevice: IoTDevice, newestToDelete: ReceivedMessageMetadata[]) {
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
        this.logger.debug(`Deleted: ${result.affected} rows from received_message_metadata`);
    }

    mapDtoToNewReceivedMessageMetadata(
        dto: RawIoTDeviceRequestDto,
        relatedIoTDevice: IoTDevice
    ): ReceivedMessageMetadata {
        const newMetadata = new ReceivedMessageMetadata();
        newMetadata.device = relatedIoTDevice;
        newMetadata.sentTime = dto.unixTimestamp ? new Date(dto.unixTimestamp) : new Date();

        return newMetadata;
    }

    private async saveSigFoxStats(dto: ReceivedMessage): Promise<void> {
        const sigFoxMessage: ReceivedMessageSigFoxSignals = { ...dto, id: undefined };
        await this.receivedMessageSigFoxSignalsRepository.insert(sigFoxMessage);
    }

    /**
     * Make sure we never have stats for more than X messages per device per hour
     * to avoid filling the database
     * @param latestMessageTime
     * @param deviceId
     */
    private async deleteSigFoxStatsSinceLastHour(latestMessageTime: Date, deviceId: number): Promise<void> {
        const lastHour = subtractHours(latestMessageTime);
        // Find the oldest items since the last hour
        const oldestToDelete = await this.receivedMessageSigFoxSignalsRepository.find({
            where: { device: { id: deviceId }, sentTime: MoreThan(lastHour) },
            skip: this.maxSigFoxSignalsMessagesPerHour,
            order: {
                sentTime: "DESC",
            },
        });

        if (oldestToDelete.length === 0) {
            this.logger.debug(
                `Less than ${this.maxSigFoxSignalsMessagesPerHour} SigFox stat objects for device ${deviceId} found in database. Deleting no rows.`
            );
            return;
        }

        const result = await this.receivedMessageSigFoxSignalsRepository.delete(oldestToDelete.map(old => old.id));

        this.logger.debug(`Deleted: ${result.affected} rows from received_message_sigfox_signals`);
    }

    /**
     * Clean up SigFox stats for the device if they are older than 1 year
     * @param deviceId
     */
    private async deleteOldSigFoxStats(deviceId: number): Promise<void> {
        const lastYear = subtractYears(new Date());
        // Find messages older than a date and delete them
        const oldestToDelete = await this.receivedMessageSigFoxSignalsRepository.find({
            where: [
                { device: { id: deviceId }, sentTime: LessThan(lastYear) },
                { device: { id: deviceId }, updatedAt: LessThan(lastYear) },
            ],
        });

        if (oldestToDelete.length === 0) {
            this.logger.debug("There's no old SigFox signal messages");
            return;
        }

        const result = await this.receivedMessageSigFoxSignalsRepository.delete(oldestToDelete.map(old => old.id));

        this.logger.debug(`Deleted: ${result.affected} rows from received_message_sigfox_signals`);
    }
}
