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
import { DataTargetController } from "@admin-controller/data-target.controller";
import { DataTargetService } from "@services/data-target.service";
import { DataTargetSenderModule } from "@modules/data-target-sender.module";
import { RecieveDataModule } from "./recieve-data.module";
import { RecieveDataController } from "@device-data-controller/recieve-data.controller";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "postgres",
            host:
                process.env.DATABASE_HOSTNAME != undefined
                    ? process.env.DATABASE_HOSTNAME
                    : "host.docker.internal",
            port:
                process.env.DATABASE_PORT != undefined
                    ? Number.parseInt(process.env.DATABASE_PORT, 10)
                    : 5433,
            username: "os2iot",
            password: "toi2so",
            database: "os2iot",
            synchronize: true,
            logging: true,
            autoLoadEntities: true,
            retryAttempts: 0
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ApplicationModule,
        IoTDeviceModule,
        DataTargetModule,
        DataTargetSenderModule,
        RecieveDataModule,
    ],
    controllers: [
        AppController,
        ApplicationController,
        IoTDeviceController,
        DataTargetController,
    ],
    providers: [
        AppService,
        ApplicationService,
        IoTDeviceService,
        DataTargetService,
    ],
})
export class AppModule {
    constructor(private connection: Connection) {}
}
