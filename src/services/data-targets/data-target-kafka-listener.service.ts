import { Injectable, Logger } from "@nestjs/common";
import {
    SubscribeToFixedGroup,
    SubscribeTo,
} from "@services/kafka/kafka.decorator";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { KafkaTopicTypeMap } from "@enum/kafka-topic-mappings";
import { plainToClass } from "class-transformer";
import { ClassType } from "class-transformer/ClassTransformer";

/**
 * This will passively listen til topics and log them. Mostly for debugging.
 */
@Injectable()
export class DataTargetKafkaListenerService extends AbstractKafkaConsumer {
    protected registerTopic(): void {
        this.addTopic(KafkaTopic.TRANSFORMED_REQUEST);
    }

    @SubscribeTo(KafkaTopic.TRANSFORMED_REQUEST)
    transformedRequestListener(payload: KafkaPayload): void {
        Logger.debug(
            `[DataTargetKafkaListener - #TRANSFORMED_REQUEST]: '${JSON.stringify(
                payload
            )}'`
        );

        // TODO: Figure out what device sent this message
        const decodedPayload = plainToClass<TransformedPayloadDto, JSON>(
            TransformedPayloadDto,
            payload.body
        ) as unknown as TransformedPayloadDto;

        Logger.debug(`payload: ${JSON.stringify(decodedPayload.payload)}`);

        // TODO: Figure out which data targets needs this message
        // TODO: Send to data targets
    }
}
