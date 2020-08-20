import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { PayloadDecoderListenerService } from "@services/payload-decoder-listener.service";
import { KafkaModule } from "@modules/kafka.module";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { IoTDeviceService } from "@services/iot-device.service";
import { ApplicationModule } from "@modules/application.module";
import { ApplicationService } from "@services/application.service";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/iot-device-payload-decoder-data-target-connection.service";
import { IoTDevicePayloadDecoderDataTargetConnection } from "../entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "./iot-device-payload-decoder-data-target-connection.module";
import { DataTargetService } from "@services/data-target.service";
import { DataTargetModule } from "./data-target.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PayloadDecoder,
            Application,
            IoTDevice,
            GenericHTTPDevice,
            IoTDevicePayloadDecoderDataTargetConnection,
        ]),
        IoTDeviceModule,
        ApplicationModule,
        KafkaModule,
        DataTargetModule,
        forwardRef(() => IoTDevicePayloadDecoderDataTargetConnectionModule),
    ],
    exports: [TypeOrmModule],
    controllers: [PayloadDecoderController],
    providers: [
        PayloadDecoderService,
        PayloadDecoderListenerService,
        ApplicationService,
        IoTDeviceService,
        IoTDevicePayloadDecoderDataTargetConnectionService,
        DataTargetService,
    ],
})
export class PayloadDecoderModule {}