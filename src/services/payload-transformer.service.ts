import { Injectable, Logger } from "@nestjs/common";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaTopic } from "@enum/kafka-topic.enum";

@Injectable()
export class PayloadTransformerListenerService extends AbstractKafkaConsumer {
    constructor() {
        super();
    }

    protected registerTopic(): void {
        this.addTopic(
            KafkaTopic.RAW_REQUEST,
            "PayloadTransformerListenerService"
        );
    }

    @CombinedSubscribeTo(
        KafkaTopic.RAW_REQUEST,
        "PayloadTransformerListenerService"
    )
    async transformedRequestListener(payload: KafkaPayload): Promise<void> {
        Logger.debug(
            `[PayloadTransformerListenerService - #RAW_REQUEST]: '${JSON.stringify(
                payload
            )}'`
        );
    }
}
