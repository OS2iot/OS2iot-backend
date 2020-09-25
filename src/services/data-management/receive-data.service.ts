import { Injectable, Logger } from "@nestjs/common";
import { KafkaService } from "@services/kafka/kafka.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaTopic } from "@entities/enum/kafka-topic.enum";
import { RawRequestDto } from "@dto/kafka/raw-request.dto";
import { RecordMetadata } from "kafkajs";

@Injectable()
export class ReceiveDataService {
    constructor(private kafkaService: KafkaService) {}

    async sendToKafka(
        iotDevice: IoTDevice,
        data: string,
        type: string,
        timestamp?: number
    ): Promise<void> {
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

        const rawStatus = await this.kafkaService.sendMessage(
            KafkaTopic.RAW_REQUEST,
            payload
        );

        if (rawStatus) {
            const metadata = rawStatus as RecordMetadata[];
            Logger.debug(`kafka status '${metadata[0].errorCode}'`);
        }
    }
}
