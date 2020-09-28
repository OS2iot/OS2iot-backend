import { Module } from "@nestjs/common";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/device-management/iot-device-payload-decoder-data-target-connection.service";
import { IoTDevicePayloadDecoderDataTargetConnectionController } from "@admin-controller/iot-device-payload-decoder-data-target-connection.controller";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { DataTargetModule } from "@modules/device-management/data-target.module";
import { PayloadDecoderModule } from "@modules/device-management/payload-decoder.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, IoTDeviceModule, DataTargetModule, PayloadDecoderModule],
    providers: [IoTDevicePayloadDecoderDataTargetConnectionService],
    exports: [IoTDevicePayloadDecoderDataTargetConnectionService],
    controllers: [IoTDevicePayloadDecoderDataTargetConnectionController],
})
export class IoTDevicePayloadDecoderDataTargetConnectionModule {}
