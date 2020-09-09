import { Module, HttpModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReceiveDataController } from "@device-data-controller/receive-data.controller";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { ApplicationService } from "@services/application.service";
import { Application } from "@entities/application.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { DataTarget } from "@entities/data-target.entity";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ChirpstackAdministrationModule } from "./device-integrations/chirpstack-administration.module";
import { LoRaWANDevice } from "../entities/lorawan-device.entity";
import { ApplicationModule } from "./application.module";

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
    ],
    exports: [TypeOrmModule, ReceiveDataService],
    controllers: [ReceiveDataController],
    providers: [
        IoTDeviceService,
        ApplicationService,
        ReceiveDataService,
        ChirpstackDeviceService,
    ],
})
export class ReceiveDataModule {}
