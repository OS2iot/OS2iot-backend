import { Module } from "@nestjs/common";

import { DataTargetController } from "@admin-controller/data-target.controller";
import { ApplicationModule } from "@modules/device-management/application.module";
import { SharedModule } from "@modules/shared.module";
import { DataTargetService } from "@services/data-targets/data-target.service";

@Module({
    imports: [SharedModule, ApplicationModule],
    exports: [DataTargetService],
    controllers: [DataTargetController],
    providers: [DataTargetService],
})
export class DataTargetModule {}
