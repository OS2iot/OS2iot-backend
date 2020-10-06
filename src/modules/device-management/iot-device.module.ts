import { Module } from "@nestjs/common";

import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ApplicationModule } from "@modules/device-management/application.module";
import { SharedModule } from "@modules/shared.module";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { SigfoxDeviceModule } from "@modules/device-integrations/sigfox-device.module";
import { SigFoxGroupModule } from "@modules/device-integrations/sigfox-group.module";

@Module({
    imports: [
        SharedModule,
        ChirpstackAdministrationModule,
        ApplicationModule,
        SigfoxDeviceModule,
        SigFoxGroupModule,
    ],
    exports: [IoTDeviceService],
    controllers: [IoTDeviceController],
    providers: [IoTDeviceService],
})
export class IoTDeviceModule {}
