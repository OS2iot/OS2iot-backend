import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/applikation.entity";
import { ApplicationController } from "@admin-controller/application.controller";
import { ApplicationService } from "@services/application.service";
import { IoTDevice } from "@entities/iot-device.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Application, IoTDevice])],
    exports: [TypeOrmModule],
    controllers: [ApplicationController],
    providers: [ApplicationService],
})
export class ApplicationModule {}
