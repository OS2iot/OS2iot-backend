import { Module, HttpModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { DataTarget } from "@entities/data-target.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { ReceivedMessage } from "@entities/received-message";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { ChirpstackAdministrationModule } from "./device-integrations/chirpstack-administration.module";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ApplicationModule } from "./application.module";
import { SigFoxDevice } from "@entities/sigfox-device.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            IoTDevice,
            GenericHTTPDevice,
            LoRaWANDevice,
            SigFoxDevice,
            DataTarget,
            ReceivedMessage,
            ReceivedMessageMetadata,
        ]),
        ChirpstackAdministrationModule,
        HttpModule,
        ApplicationModule,
    ],
    exports: [TypeOrmModule, IoTDeviceService],
    controllers: [IoTDeviceController],
    providers: [IoTDeviceService],
})
export class IoTDeviceModule {}
