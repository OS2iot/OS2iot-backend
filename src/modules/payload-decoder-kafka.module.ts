import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { PayloadDecoderListenerService } from "@services/payload-decoder-listener.service";
import { KafkaModule } from "@modules/kafka.module";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "./iot-device-payload-decoder-data-target-connection.module";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/iot-device-payload-decoder-data-target-connection.service";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDeviceService } from "../services/iot-device.service";
import { DataTargetService } from "../services/data-target.service";
import { PayloadDecoderService } from "../services/payload-decoder.service";
import { IoTDeviceModule } from "./iot-device.module";
import { DataTargetModule } from "./data-target.module";
import { PayloadDecoderModule } from "./payload-decoder.module";
import { ApplicationService } from "../services/application.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PayloadDecoder,
            Application,
            IoTDevice,
            GenericHTTPDevice,
            IoTDevicePayloadDecoderDataTargetConnection,
        ]),
        KafkaModule,
        IoTDevicePayloadDecoderDataTargetConnectionModule,
        IoTDeviceModule,
        DataTargetModule,
        PayloadDecoderModule,
    ],
    exports: [TypeOrmModule],
    controllers: [PayloadDecoderController],
    providers: [
        PayloadDecoderListenerService,
        IoTDevicePayloadDecoderDataTargetConnectionService,
        IoTDeviceService,
        DataTargetService,
        PayloadDecoderService,
        ApplicationService,
    ],
})
export class PayloadDecoderKafkaModule {}
