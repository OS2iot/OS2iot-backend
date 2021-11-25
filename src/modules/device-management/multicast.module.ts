import { HttpModule, HttpService, Module } from "@nestjs/common";
import { MulticastService } from "../../services/device-management/multicast.service";
import { MulticastController } from "../../controllers/admin-controller/multicast.controller";
import { SharedModule } from "@modules/shared.module";
import { ApplicationModule } from "./application.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";

@Module({
    imports: [
        SharedModule,
        ApplicationModule,
        HttpModule,
        ChirpstackAdministrationModule
    ],
    exports: [MulticastService],
    controllers: [MulticastController],
    providers: [MulticastService],
})
export class MulticastModule {}
