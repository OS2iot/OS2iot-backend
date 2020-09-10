import { Module, HttpModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReceiveDataController } from "@device-data-controller/receive-data.controller";
import { IoTDevice } from "@entities/iot-device.entity";
import { Application } from "@entities/application.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { DataTarget } from "@entities/data-target.entity";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { ChirpstackAdministrationModule } from "./device-integrations/chirpstack-administration.module";
import { LoRaWANDevice } from "../entities/lorawan-device.entity";
import { ApplicationModule } from "./application.module";
import { IoTDeviceModule } from "./iot-device.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IoTDevice,
            GenericHTTPDevice,
            LoRaWANDevice,
            Application,
            DataTarget,
            ReceivedMessage,
            ReceivedMessageMetadata,
        ]),
        ChirpstackAdministrationModule,
        HttpModule,
        ApplicationModule,
        IoTDeviceModule,
    ],
    exports: [TypeOrmModule, ReceiveDataService],
    controllers: [ReceiveDataController],
    providers: [ReceiveDataService],
})
export class ReceiveDataModule {}
