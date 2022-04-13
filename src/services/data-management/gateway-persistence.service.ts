import { RawGatewayStateDto } from "@dto/kafka/raw-gateway-state.dto";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { Injectable, Logger, NotImplementedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChirpstackOnlineHistoryService } from "@services/chirpstack/chirpstack-online-history.service";
import { AbstractKafkaConsumer } from "@services/kafka/kafka.abstract.consumer";
import { CombinedSubscribeTo } from "@services/kafka/kafka.decorator";
import { KafkaPayload } from "@services/kafka/kafka.message";

@Injectable()
export class GatewayPersistenceService extends AbstractKafkaConsumer {
    private gatewayOnlineStatusSavedDays: number;

    constructor(
        private chirpstackOnlineHistoryService: ChirpstackOnlineHistoryService,
        private configService: ConfigService
    ) {
        super();
        this.gatewayOnlineStatusSavedDays = configService.get<number>(
            "chirpstack.gatewayOnlineStatusSavedDays"
        );
    }

    private readonly logger = new Logger(GatewayPersistenceService.name);

    protected registerTopic(): void {
        this.addTopic(KafkaTopic.RAW_GATEWAY_STATE, "GatewayPersistence");
    }

    // Listen to Kafka event
    @CombinedSubscribeTo(KafkaTopic.RAW_REQUEST, "GatewayPersistence")
    async rawRequestListener(payload: KafkaPayload): Promise<void> {
        this.logger.debug(`RAW_REQUEST: '${JSON.stringify(payload)}'`);
        const dto: RawGatewayStateDto = payload.body;

        // TODO: Save last X messages worth of data
        throw new NotImplementedException();
    }
}
