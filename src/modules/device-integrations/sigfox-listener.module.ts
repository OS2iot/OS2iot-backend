import { IoTDeviceModule } from "@modules/iot-device.module";
import { Module } from "@nestjs/common";

import { SigFoxListenerController } from "@device-data-controller/sigfox-listener.controller";
import { ReceiveDataModule } from "@modules/receive-data.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, IoTDeviceModule, ReceiveDataModule],
    controllers: [SigFoxListenerController],
})
export class SigFoxListenerModule {}
