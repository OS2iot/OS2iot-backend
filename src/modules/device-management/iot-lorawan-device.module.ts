import { SharedModule } from "@modules/shared.module";
import { Module } from "@nestjs/common";
import { IoTLoRaWANDeviceService } from "@services/device-management/iot-lorawan-device.service";

@Module({
  imports: [SharedModule],
  exports: [IoTLoRaWANDeviceService],
  controllers: [],
  providers: [IoTLoRaWANDeviceService],
})
export class IoTLoRaWANDeviceModule {}
