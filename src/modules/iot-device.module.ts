import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/applikation.entity";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { ApplicationService } from "@services/application.service";

@Module({
    imports: [TypeOrmModule.forFeature([Application, IoTDevice])],
    exports: [TypeOrmModule],
    controllers: [IoTDeviceController],
    providers: [IoTDeviceService, ApplicationService],
})
export class IoTDeviceModule {}
