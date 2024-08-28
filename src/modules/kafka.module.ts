import { Global, Module } from "@nestjs/common";
import { KafkaService } from "@services/kafka/kafka.service";
import { HealthCheckModule } from "@modules/health-check.module";

@Global()
@Module({
  controllers: [],
  imports: [HealthCheckModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
