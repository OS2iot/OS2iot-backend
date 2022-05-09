import { RawGatewayStateDto } from "@dto/kafka/raw-gateway-state.dto";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { Injectable, Logger } from "@nestjs/common";
import { GatewayStatusHistoryService } from "@services/chirpstack/gateway-status-history.service";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { KafkaPayload } from "@services/kafka/kafka.message";

@Injectable()
export class GatewayPersistenceService extends AbstractKafkaConsumer {
    private gatewayStatusSavedDays: number;

    constructor(private gatewayStatusHistoryService: GatewayStatusHistoryService) {
        super();
        this.gatewayStatusSavedDays = 30;
    }

    private readonly logger = new Logger(GatewayPersistenceService.name);

    protected registerTopic(): void {
        this.addTopic(KafkaTopic.RAW_GATEWAY_STATE, "GatewayPersistence");
    }

    // Listen to Kafka event
    @CombinedSubscribeTo(KafkaTopic.RAW_GATEWAY_STATE, "GatewayPersistence")
    async rawRequestListener(payload: KafkaPayload): Promise<void> {
        this.logger.debug(`RAW_GATEWAY_STATE: '${JSON.stringify(payload)}'`);
        // TODO: GATEWAY-STATUS: Do proper validation
        const dto = payload.body as RawGatewayStateDto;

        // TODO: GATEWAY-STATUS: Save last X messages worth of data
    }
}
