import { Module, forwardRef, HttpModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { IoTDeviceService } from "@services/iot-device.service";
import { ApplicationModule } from "@modules/application.module";
import { ApplicationService } from "@services/application.service";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/iot-device-payload-decoder-data-target-connection.service";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "./iot-device-payload-decoder-data-target-connection.module";
import { DataTargetService } from "@services/data-target.service";
import { DataTargetModule } from "./data-target.module";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";

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
        DataTargetModule,
        forwardRef(() => IoTDevicePayloadDecoderDataTargetConnectionModule),
        ChirpstackAdministrationModule,
        HttpModule,
    ],
    exports: [TypeOrmModule],
    controllers: [PayloadDecoderController],
    providers: [
        PayloadDecoderService,
        ApplicationService,
        IoTDeviceService,
        IoTDevicePayloadDecoderDataTargetConnectionService,
        DataTargetService,
        ChirpstackDeviceService,
    ],
})
export class PayloadDecoderModule {}
