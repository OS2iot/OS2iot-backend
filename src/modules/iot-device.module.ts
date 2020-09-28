import { Module } from "@nestjs/common";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { IoTDeviceService } from "@services/iot-device.service";
import { ChirpstackAdministrationModule } from "./device-integrations/chirpstack-administration.module";
import { ApplicationModule } from "./application.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, ChirpstackAdministrationModule, ApplicationModule],
    exports: [IoTDeviceService],
    controllers: [IoTDeviceController],
    providers: [IoTDeviceService],
})
export class IoTDeviceModule {}
