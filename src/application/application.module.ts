import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "../entity/applikation.entity";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./application.service";
import { IoTDevice } from "../entity/iotdevice.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Application, IoTDevice])],
    exports: [TypeOrmModule],
    controllers: [ApplicationController],
    providers: [ApplicationService],
})
export class ApplicationModule {}
