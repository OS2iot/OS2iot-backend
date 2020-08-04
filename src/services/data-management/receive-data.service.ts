import { Injectable, Logger } from "@nestjs/common";
import { KafkaService } from "@services/kafka/kafka.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { KafkaPayload } from "../kafka/kafka.message";
import { KafkaTopic } from "@entities/enum/kafka-topic.enum";
import { RawRequestDto } from "@entities/dto/kafka/raw-request.dto";
import { RecordMetadata } from "kafkajs";

@Injectable()
export class ReceiveDataService {
    constructor(private kafkaService: KafkaService) {}

    async sendToKafka(iotDevice: IoTDevice, data: string): Promise<void> {
        const dto = new RawRequestDto();
        dto.iotDeviceId = iotDevice.id;
        dto.rawPayload = JSON.parse(data);
        // We cannot generically know when it was sent by the device, "now" is accurate enough
        dto.unixTimestamp = new Date().valueOf();

        const payload: KafkaPayload = {
            messageId: "genericHttp" + new Date().valueOf(),
            body: dto,
            messageType: "receiveData.genericHttp",
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
