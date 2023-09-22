import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { ApplicationModule } from "@modules/device-management/application.module";
import { DataTargetModule } from "@modules/device-management/data-target.module";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/device-management/iot-device-payload-decoder-data-target-connection.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { PayloadDecoderModule } from "@modules/device-management/payload-decoder.module";
import { KafkaModule } from "@modules/kafka.module";
import { PayloadDecoderExecutorModuleModule } from "@modules/payload-decoder-executor-module.module";
import { SharedModule } from "@modules/shared.module";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { PayloadDecoderListenerService } from "@services/data-management/payload-decoder-listener.service";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";

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
        PayloadDecoderExecutorModuleModule,
        ChirpstackAdministrationModule,
    ],
    controllers: [PayloadDecoderController],
    providers: [PayloadDecoderListenerService],
})
export class PayloadDecoderKafkaModule {}
