import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataTarget } from "@entities/data-target.entity";
import { DataTargetController } from "@admin-controller/data-target.controller";
import { DataTargetService } from "@services/data-target.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { Application } from "@entities/applikation.entity";


@Module({
    imports: [TypeOrmModule.forFeature([DataTarget]),],
    exports: [TypeOrmModule],
    controllers: [DataTargetController],
    providers: [DataTargetService],
})
export class DataTargetModule { }
