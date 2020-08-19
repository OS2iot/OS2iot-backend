import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { PayloadTransformerListenerService } from "@services/payload-transformer.service";
import { KafkaModule } from "@modules/kafka.module";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { IoTDeviceService } from "@services/iot-device.service";
import { ApplicationModule } from "@modules/application.module";
import { ApplicationService } from "@services/application.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PayloadDecoder,
            Application,
            IoTDevice,
            GenericHTTPDevice,
        ]),
        IoTDeviceModule,
        ApplicationModule,
        KafkaModule,
    ],
    exports: [TypeOrmModule],
    controllers: [PayloadDecoderController],
    providers: [
        PayloadDecoderService,
        PayloadTransformerListenerService,
        ApplicationService,
        IoTDeviceService,
    ],
})
export class PayloadDecoderModule {}
