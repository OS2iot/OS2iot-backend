import { Module, HttpModule } from "@nestjs/common";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ApplicationModule } from "@modules/device-management/application.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
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
