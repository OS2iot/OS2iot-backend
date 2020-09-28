import { Module, HttpModule } from "@nestjs/common";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { PayloadDecoderListenerService } from "@services/payload-decoder-listener.service";
import { KafkaModule } from "@modules/kafka.module";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/iot-device-payload-decoder-data-target-connection.module";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { DataTargetModule } from "@modules/data-target.module";
import { PayloadDecoderModule } from "@modules/payload-decoder.module";
import { ApplicationModule } from "./application.module";
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
