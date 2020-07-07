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
import { EndpointModule } from "@modules/endpoint.module";
import { EndpointService } from "@services/endpoint.service";
import { EndpointController } from "@admin-controller/endpoint.controller";


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
        EndpointModule,
    ],
    controllers: [AppController, ApplicationController, IoTDeviceController, EndpointController],
    providers: [AppService, ApplicationService, IoTDeviceService, EndpointService],
})
export class AppModule {
    constructor(private connection: Connection) { }
}
