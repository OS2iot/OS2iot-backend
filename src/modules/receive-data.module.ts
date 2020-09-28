import { Module, HttpModule } from "@nestjs/common";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { ChirpstackAdministrationModule } from "./device-integrations/chirpstack-administration.module";
import { ApplicationModule } from "@modules/application.module";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { ReceiveDataController } from "@device-data-controller/receive-data.controller";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [
        SharedModule,
        ChirpstackAdministrationModule,
        HttpModule,
        ApplicationModule,
        IoTDeviceModule,
    ],
    exports: [ReceiveDataService],
    controllers: [ReceiveDataController],
    providers: [ReceiveDataService],
})
export class ReceiveDataModule {}
