import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { ApplicationService } from "@services/application.service";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { DataTarget } from "@entities/data-target.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            IoTDevice,
            GenericHTTPDevice,
            DataTarget,
        ]),
    ],
    exports: [TypeOrmModule],
    controllers: [IoTDeviceController],
    providers: [IoTDeviceService, ApplicationService],
})
export class IoTDeviceModule {}
