import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "@admin-controller/app.controller";
import { AppService } from "@services/app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { ApplicationModule } from "@modules/application.module";
import { ApplicationController } from "@admin-controller/application.controller";
import { ApplicationService } from "@services/application.service";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDeviceModule } from "@modules/iot-device.module";

import { DataTargetModule } from "@modules/data-target.module";
import { DataTargetService } from "@services/data-target.service";
import { DataTargetController } from "@admin-controller/data-target.controller";


import { HttpPushTargetModule } from "@modules/http-push-target.module";
import { HttpPushTargetService } from "@services/http-push-target.service";
import { HttpPushTargetController } from "@admin-controller/http-push-target.controller";


@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "postgres",
            host: "host.docker.internal",
            port: 5433,
            username: "os2iot",
            password: "toi2so",
            database: "os2iot",
            synchronize: true,
            logging: true,
            autoLoadEntities: true,
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ApplicationModule,
        IoTDeviceModule,
        HttpPushTargetModule,
        DataTargetModule,
    ],
    controllers: [AppController, ApplicationController, IoTDeviceController, HttpPushTargetController,DataTargetController],
    providers: [AppService, ApplicationService, IoTDeviceService, HttpPushTargetService,DataTargetService],
})
export class AppModule {
    constructor(private connection: Connection) { }
}
