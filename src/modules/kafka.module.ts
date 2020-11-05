import { DynamicModule, Global, Module } from "@nestjs/common";

import { KafkaController } from "@device-data-controller/kafka.controller";
import { KafkaService } from "@services/kafka/kafka.service";
import { KafkaConfig } from "kafkajs";

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
            ],
            exports: [KafkaService],
        };
    }
}
