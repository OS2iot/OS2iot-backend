import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecieveDataController } from "@device-data-controller/recieve-data.controller";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { ApplicationService } from "@services/application.service";
import { Application } from "@entities/application.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([IoTDevice, Application, GenericHTTPDevice]),
    ],
    exports: [TypeOrmModule],
    controllers: [RecieveDataController],
    providers: [IoTDeviceService, ApplicationService],
})
export class RecieveDataModule {}
