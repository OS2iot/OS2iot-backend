import { Module } from "@nestjs/common";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ApplicationModule } from "@modules/device-management/application.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, ChirpstackAdministrationModule, ApplicationModule],
    exports: [IoTDeviceService],
    controllers: [IoTDeviceController],
    providers: [IoTDeviceService],
})
export class IoTDeviceModule {}
