import { Module } from "@nestjs/common";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/iot-device-payload-decoder-data-target-connection.service";
import { IoTDevicePayloadDecoderDataTargetConnectionController } from "@admin-controller/iot-device-payload-decoder-data-target-connection.controller";
import { IoTDeviceModule } from "./iot-device.module";
import { DataTargetModule } from "./data-target.module";
import { PayloadDecoderModule } from "./payload-decoder.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, IoTDeviceModule, DataTargetModule, PayloadDecoderModule],
    providers: [IoTDevicePayloadDecoderDataTargetConnectionService],
    exports: [IoTDevicePayloadDecoderDataTargetConnectionService],
    controllers: [IoTDevicePayloadDecoderDataTargetConnectionController],
})
export class IoTDevicePayloadDecoderDataTargetConnectionModule {}
