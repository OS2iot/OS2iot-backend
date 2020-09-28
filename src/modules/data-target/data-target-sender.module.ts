import { HttpModule, Module } from "@nestjs/common";

import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";

@Module({
    imports: [HttpModule],
    providers: [HttpPushDataTargetService],
    exports: [HttpPushDataTargetService],
})
export class DataTargetSenderModule {}
