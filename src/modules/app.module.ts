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
import { GenericTargetModule } from "@modules/generic-target.module";
import { GenericTargetService } from "@services/generic-target.service";
import { GenericTargetController } from "@admin-controller/generic-target.controller";


import { HttpPushModule } from "@modules/http-push.module";
import { HttpPushService } from "@services/http-push.service";
import { HttpPushController } from "@admin-controller/http-push.controller";


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
        GenericTargetModule,
        HttpPushModule,
    ],
    controllers: [AppController, ApplicationController, IoTDeviceController, GenericTargetController,HttpPushController],
    providers: [AppService, ApplicationService, IoTDeviceService, GenericTargetService,HttpPushService],
})
export class AppModule {
    constructor(private connection: Connection) { }
}
