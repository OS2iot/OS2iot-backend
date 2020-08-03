import { Controller, Post, Logger, HttpCode, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { KafkaService } from "@services/kafka/kafka.service";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { RecordMetadata } from "kafkajs";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { RawRequestDto } from "@dto/kafka/raw-request.dto";

/**
 * This controller is intented to be used to send Kafka messages, mostly for testing.
 */
@ApiTags("Kafka")
@Controller("kafka")
export class KafkaController {
    constructor(private readonly kafkaService: KafkaService) {}

    @Post("rawRequest/:id")
    @HttpCode(204)
    async makeRawRequest(@Param("id") id: number): Promise<void> {
        const dto = new RawRequestDto();
        dto.iotDeviceId = id;
        dto.rawPayload = JSON.parse('{ "en_key": "en_value" }');
        dto.unixTimestamp = new Date().valueOf();

        const payload: KafkaPayload = {
            messageId: "a" + new Date().valueOf(),
            body: dto,
            messageType: "Say.Hello",
            topicName: KafkaTopic.RAW_REQUEST,
        };
        const value = await this.kafkaService.sendMessage(
            KafkaTopic.RAW_REQUEST,
            payload
        );

        if (value) {
            const metadata = value as RecordMetadata[];
            Logger.log(`kafka status '${metadata[0].errorCode}'`);
        }
    }

    @Post("transformedPayload")
    @HttpCode(204)
    async makeTransformedPayload(): Promise<void> {
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

        if (value2) {
            const metadata = value2 as RecordMetadata[];
            Logger.log(`kafka status '${metadata[0].errorCode}'`);
        }
    }
}
