import { Module, HttpModule } from "@nestjs/common";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { PayloadDecoderListenerService } from "@services/data-management/payload-decoder-listener.service";
import { KafkaModule } from "@modules/kafka.module";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/device-management/iot-device-payload-decoder-data-target-connection.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { DataTargetModule } from "@modules/device-management/data-target.module";
import { PayloadDecoderModule } from "@modules/device-management/payload-decoder.module";
import { ApplicationModule } from "@modules/device-management/application.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [
        SharedModule,
        KafkaModule,
        IoTDevicePayloadDecoderDataTargetConnectionModule,
        IoTDeviceModule,
        DataTargetModule,
        PayloadDecoderModule,
        HttpModule,
        ApplicationModule,
    ],
    controllers: [PayloadDecoderController],
    providers: [PayloadDecoderListenerService],
})
export class PayloadDecoderKafkaModule {}
