import { Module, HttpModule } from "@nestjs/common";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";

@Module({
    imports: [HttpModule],
    providers: [HttpPushDataTargetService],
})
export class DataTargetSenderModule {}
