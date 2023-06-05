import { forwardRef, Module } from "@nestjs/common";

import { ReceiveDataController } from "@device-data-controller/receive-data.controller";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ApplicationModule } from "@modules/device-management/application.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { SharedModule } from "@modules/shared.module";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [
        SharedModule,
        ChirpstackAdministrationModule,
        HttpModule,
        forwardRef(() => ApplicationModule),
        forwardRef(() => IoTDeviceModule),
    ],
    exports: [ReceiveDataService],
    controllers: [ReceiveDataController],
    providers: [ReceiveDataService],
})
export class ReceiveDataModule {}
