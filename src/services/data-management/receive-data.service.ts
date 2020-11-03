import { Injectable, Logger } from "@nestjs/common";
import { RecordMetadata } from "kafkajs";

import { RawRequestDto } from "@dto/kafka/raw-request.dto";
import { KafkaTopic } from "@entities/enum/kafka-topic.enum";
import { IoTDevice } from "@entities/iot-device.entity";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaService } from "@services/kafka/kafka.service";

@Injectable()
export class ReceiveDataService {
    constructor(private kafkaService: KafkaService) {}
    private readonly logger = new Logger(ReceiveDataService.name);

    async sendToKafka(
        iotDevice: IoTDevice,
        data: string,
        type: string,
        timestamp?: number
    ): Promise<void> {
        this.logger.debug(`Received data, sending to Kafka`);
        const dto = new RawRequestDto();
        dto.iotDeviceId = iotDevice.id;
        dto.rawPayload = JSON.parse(data);
        // We cannot generically know when it was sent by the device, "now" is accurate enough
        dto.unixTimestamp = timestamp != null ? timestamp : new Date().valueOf();

        const payload: KafkaPayload = {
            messageId: `${type}${new Date().valueOf()}`,
            body: dto,
            messageType: `receiveData.${type}`,
            topicName: KafkaTopic.RAW_REQUEST,
        };
        this.logger.debug(`Made payload: '${JSON.stringify(payload)}'`);

        const rawStatus = await this.kafkaService.sendMessage(
            KafkaTopic.RAW_REQUEST,
            payload
        );

        this.logger.debug(`Sent message to Kafka: ${JSON.stringify(rawStatus)}`);

        if (rawStatus) {
            const metadata = rawStatus as RecordMetadata[];
            this.logger.debug(`kafka status '${metadata[0].errorCode}'`);
        } else {
            this.logger.warn(`Did not get a raw status from Kafka ...`);
        }
    }
}
