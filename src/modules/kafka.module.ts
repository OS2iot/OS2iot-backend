import { Global, Module } from "@nestjs/common";

import { KafkaController } from "@device-data-controller/kafka.controller";
import { KafkaService } from "@services/kafka/kafka.service";
import { HealthCheckModule } from "src/health-check/health-check.module";

@Global()
@Module({
    controllers: [KafkaController],
    imports: [HealthCheckModule],
    providers: [KafkaService],
    exports: [KafkaService],
})
export class KafkaModule {}
