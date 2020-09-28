import { Module } from "@nestjs/common";
import { DataTargetService } from "@services/data-target.service";
import { ApplicationModule } from "@modules/application.module";
import { DataTargetController } from "@admin-controller/data-target.controller";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, ApplicationModule],
    exports: [DataTargetService],
    controllers: [DataTargetController],
    providers: [DataTargetService],
})
export class DataTargetModule {}
