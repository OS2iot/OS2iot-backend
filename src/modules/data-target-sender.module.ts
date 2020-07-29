import { Module, HttpModule } from "@nestjs/common";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import { DataTargetKafkaListenerService } from "@services/data-targets/data-target-kafka-listener.service";
import { KafkaModule } from "@modules/kafka.module";

@Module({
    imports: [HttpModule, KafkaModule],
    providers: [HttpPushDataTargetService, DataTargetKafkaListenerService],
})
export class DataTargetSenderModule {}
