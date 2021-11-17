import { Module } from "@nestjs/common";
import { MulticastService } from "../../services/device-management/multicast.service";
import { MulticastController } from "../../controllers/admin-controller/multicast.controller";
import { SharedModule } from "@modules/shared.module";
import { ApplicationModule } from "./application.module";

@Module({
    imports: [SharedModule, ApplicationModule],
    exports: [MulticastService],
    controllers: [MulticastController],
    providers: [MulticastService],
})
export class MulticastModule {}
