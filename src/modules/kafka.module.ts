import { DynamicModule, Global, Module } from "@nestjs/common";

import { KafkaController } from "@device-data-controller/kafka.controller";
import { KafkaConfig } from "@services/kafka/kafka.message";
import { KafkaService } from "@services/kafka/kafka.service";
import { ChirpstackMqttListenerModule } from "./device-integrations/chirpstack-mqtt-listener.module";

@Global()
@Module({ controllers: [KafkaController], imports: [ChirpstackMqttListenerModule] })
export class KafkaModule {
    static register(kafkaConfig: KafkaConfig): DynamicModule {
        return {
            global: true,
            module: KafkaModule,
            providers: [
                {
                    provide: KafkaService,
                    useValue: new KafkaService(kafkaConfig),
                },
            ],
            exports: [KafkaService],
        };
    }
}
