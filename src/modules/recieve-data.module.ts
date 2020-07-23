import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecieveData } from "@entities/recieve-data.entity";
import { RecieveDataController } from "@device-data-controller/recieve-data.controller";
import { RecieveDataService } from "@services/recieve-data.service";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { ApplicationService } from "@services/application.service";
import { Application } from "@entities/application.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            RecieveData,
            IoTDevice,
            Application,
            GenericHTTPDevice,
        ]),
    ],
    exports: [TypeOrmModule],
    controllers: [RecieveDataController],
    providers: [RecieveDataService, IoTDeviceService, ApplicationService],
})
export class RecieveDataModule {}
