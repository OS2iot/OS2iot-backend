import { Injectable, Logger } from "@nestjs/common";
import { SubscribeToFixedGroup } from "@services/kafka/kafka.decorator";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { SubscribeTo } from "./kafka/kafka.decorator";

/**
 * This will passively listen til topics and log them. Mostly for debugging.
 */
@Injectable()
export class KafkaListenerService extends AbstractKafkaConsumer {
    protected registerTopic(): void {
        this.addTopic(KafkaTopic.RAW_REQUEST);
        // this.addTopic(KafkaTopics.TRANSFORMED_REQUEST);
    }

    @SubscribeTo(KafkaTopic.RAW_REQUEST)
    // eslint-disable-next-line @typescript-eslint/ban-types
    rawRequestListener(payload: KafkaPayload): void {
        Logger.debug(`[KafkaLogger - #RAW_REQUEST]: '${JSON.stringify(payload)}'`);
    }

    @SubscribeTo(KafkaTopic.TRANSFORMED_REQUEST)
    transformedRequestListener(payload: KafkaPayload): void {
        Logger.debug(`[KafkaLogger - #TRANSFORMED_REQUEST]: '${JSON.stringify(payload)}'`);
    }
}
