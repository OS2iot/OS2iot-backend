import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import { MqttDataTargetService } from "@services/data-targets/mqtt-data-target.service";

@Module({
  imports: [HttpModule],
  providers: [HttpPushDataTargetService, MqttDataTargetService],
  exports: [HttpPushDataTargetService, MqttDataTargetService],
})
export class DataTargetSenderModule {}
