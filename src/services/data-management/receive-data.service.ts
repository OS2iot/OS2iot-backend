import { RawGatewayStateDto } from "@dto/kafka/raw-gateway-state.dto";
import { RawIoTDeviceRequestDto } from "@dto/kafka/raw-iot-device-request.dto";
import { RawRequestDto } from "@dto/kafka/raw-request.dto";
import { KafkaTopic } from "@entities/enum/kafka-topic.enum";
import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { Injectable, Logger } from "@nestjs/common";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaService } from "@services/kafka/kafka.service";
import { RecordMetadata } from "kafkajs";

@Injectable()
export class ReceiveDataService {
    constructor(private kafkaService: KafkaService) {}
    private readonly logger = new Logger(ReceiveDataService.name);

    async sendRawIotDeviceRequestToKafka(
        iotDevice: IoTDevice,
        data: string,
        type: IoTDeviceType[number],
        timestamp?: number
    ): Promise<void> {
        const dto = new RawIoTDeviceRequestDto();
        dto.iotDeviceId = iotDevice.id;
        try {
            dto.rawPayload = JSON.parse(data);
        } catch (e) {
            dto.rawPayload = JSON.parse("{}");
        }
        const payload = this.buildMessage(dto, type, KafkaTopic.RAW_REQUEST, timestamp);

        await this.doSendToKafka(payload, KafkaTopic.RAW_REQUEST);
    }

    async sendRawGatewayStateToKafka(
        gatewayId: string,
        data: string,
        timestamp?: number
    ): Promise<void> {
        const dto = new RawGatewayStateDto();
        dto.gatewayId = gatewayId;
        dto.rawPayload = JSON.parse(data);
        const payload = this.buildMessage(
            dto,
            "GATEWAY",
            KafkaTopic.RAW_GATEWAY_STATE,
            timestamp
        );

        await this.doSendToKafka(payload, KafkaTopic.RAW_GATEWAY_STATE);
    }

    private buildMessage(
        dto: RawRequestDto,
        type: string,
        topicName: KafkaTopic,
        timestamp?: number
    ): KafkaPayload {
        this.logger.debug(`Received data, sending to Kafka`);
        dto.type = type;
        // We cannot generically know when it was sent by the device, "now" is accurate enough
        dto.unixTimestamp =
            timestamp !== null && timestamp !== undefined
                ? timestamp
                : new Date().valueOf();

        const payload: KafkaPayload = {
            messageId: `${type}${new Date().valueOf()}`,
            body: dto,
            messageType: `receiveData.${type}`,
            topicName,
        };
        this.logger.debug(`Made payload: '${JSON.stringify(payload)}'`);

        return payload;
    }

    private async doSendToKafka(payload: KafkaPayload, topic: KafkaTopic) {
        const rawStatus = await this.kafkaService.sendMessage(topic, payload);

        this.logger.debug(`Sent message to Kafka: ${JSON.stringify(rawStatus)}`);

        if (rawStatus) {
            const metadata = rawStatus as RecordMetadata[];
            this.logger.debug(`kafka status '${metadata[0].errorCode}'`);
        } else {
            this.logger.warn(`Did not get a raw status from Kafka ...`);
        }
    }
}
