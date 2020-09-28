import { Module } from "@nestjs/common";

import { IoTDevicePayloadDecoderDataTargetConnectionController } from "@admin-controller/iot-device-payload-decoder-data-target-connection.controller";
import { DataTargetModule } from "@modules/device-management/data-target.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { PayloadDecoderModule } from "@modules/device-management/payload-decoder.module";
import { SharedModule } from "@modules/shared.module";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/device-management/iot-device-payload-decoder-data-target-connection.service";

@Module({
    imports: [SharedModule, IoTDeviceModule, DataTargetModule, PayloadDecoderModule],
    providers: [IoTDevicePayloadDecoderDataTargetConnectionService],
    exports: [IoTDevicePayloadDecoderDataTargetConnectionService],
    controllers: [IoTDevicePayloadDecoderDataTargetConnectionController],
})
export class IoTDevicePayloadDecoderDataTargetConnectionModule {}
