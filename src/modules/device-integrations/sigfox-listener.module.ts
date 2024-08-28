import { Module } from "@nestjs/common";

import { SigFoxListenerController } from "@device-data-controller/sigfox-listener.controller";
import { ReceiveDataModule } from "@modules/device-integrations/receive-data.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { SharedModule } from "@modules/shared.module";

@Module({
  imports: [SharedModule, IoTDeviceModule, ReceiveDataModule],
  controllers: [SigFoxListenerController],
})
export class SigFoxListenerModule {}
