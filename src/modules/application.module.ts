import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { ApplicationController } from "@admin-controller/application.controller";
import { ApplicationService } from "@services/application.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { DataTarget } from "@entities/data-target.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Application, IoTDevice, DataTarget])],
    exports: [TypeOrmModule],
    controllers: [ApplicationController],
    providers: [ApplicationService],
})
export class ApplicationModule {}
