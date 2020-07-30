import { DynamicModule, Global, Module } from "@nestjs/common";
import { KafkaService } from "@services/kafka/kafka.service";
import { KafkaConfig } from "@services/kafka/kafka.message";
import { KafkaListenerService } from "@services/kafka-listener.service";
import { KafkaController } from "@device-data-controller/kafka.controller";

@Global()
@Module({ controllers: [KafkaController] })
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
                KafkaListenerService,
            ],
            exports: [KafkaService],
        };
    }
}
