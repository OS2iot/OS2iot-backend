import { Module, HttpModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { ApplicationModule } from "@modules/application.module";
import { ApplicationController } from "@admin-controller/application.controller";
import { ApplicationService } from "@services/application.service";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";

import { DataTargetModule } from "@modules/data-target.module";
import { DataTargetController } from "@admin-controller/data-target.controller";
import { DataTargetService } from "@services/data-target.service";
import { DataTargetSenderModule } from "@modules/data-target-sender.module";
import { ReceiveDataModule } from "@modules/receive-data.module";
import { KafkaModule } from "@modules/kafka.module";
import { DataTargetKafkaModule } from "@modules/data-target-kafka.module";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import { PayloadDecoderModule } from "@modules/payload-decoder.module";

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
            logging: false,
            autoLoadEntities: true,
            retryAttempts: 0,
            maxQueryExecutionTime: 1000, // Log queries slower than 1000 ms
        }),
        KafkaModule.register({
            clientId: "os2iot-client",
            brokers: [
                `${process.env.KAFKA_HOSTNAME || "host.docker.internal"}:${
                    process.env.KAFKA_PORT || "9093"
                }`,
            ],
            groupId: "os2iot-backend",
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        HttpModule,
        ApplicationModule,
        IoTDeviceModule,
        DataTargetModule,
        DataTargetKafkaModule,
        DataTargetSenderModule,
        ReceiveDataModule,
        ChirpstackAdministrationModule,
        PayloadDecoderModule,
    ],
    controllers: [
        ApplicationController,
        IoTDeviceController,
        DataTargetController,
    ],
    providers: [
        ApplicationService,
        IoTDeviceService,
        DataTargetService,
        HttpPushDataTargetService,
    ],
})
export class AppModule {
    constructor(private connection: Connection) {}
}
