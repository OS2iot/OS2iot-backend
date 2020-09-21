import { Application } from "@entities/application.entity";
import { DataTarget } from "@entities/data-target.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SigFoxListenerService } from "@services/data-management/sigfox-listener.service";
import { SigFoxListenerController } from "@device-data-controller/sigfox-listener.controller";
import { ReceiveDataModule } from "@modules/receive-data.module";

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
        IoTDeviceModule,
        ReceiveDataModule,
    ],
    exports: [TypeOrmModule],
    controllers: [SigFoxListenerController],
    providers: [],
})
export class SigFoxListenerModule {}
