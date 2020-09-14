import { Module, HttpModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationModule } from "@modules/application.module";
import { ApplicationService } from "@services/application.service";
import { IoTDeviceService } from "@services/iot-device.service";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { DataTargetModule } from "@modules/data-target.module";
import { DataTargetService } from "@services/data-target.service";
import { DataTargetSenderModule } from "@modules/data-target-sender.module";
import { ReceiveDataModule } from "@modules/receive-data.module";
import { KafkaModule } from "@modules/kafka.module";
import { DataTargetKafkaModule } from "@modules/data-target-kafka.module";
import { PayloadDecoderModule } from "@modules/payload-decoder.module";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ChirpstackMqttListenerModule } from "@modules/device-integrations/chirpstack-mqtt-listener.module";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/iot-device-payload-decoder-data-target-connection.module";
import { PayloadDecoderKafkaModule } from "@modules/payload-decoder-kafka.module";
import { DefaultModule } from "@modules/default.module";
import { AuthModule } from "./auth.module";
import { OrganizationModule } from "./organization.module";
import { PermissionModule } from "./permission.module";

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
            maxQueryExecutionTime: 200, // Log queries slower than 200 ms
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
        IoTDevicePayloadDecoderDataTargetConnectionModule,
        ChirpstackMqttListenerModule,
        PayloadDecoderKafkaModule,
        DefaultModule,
        AuthModule,
        OrganizationModule,
        PermissionModule,
    ],
    controllers: [],
    providers: [
        ApplicationService,
        IoTDeviceService,
        DataTargetService,
        ChirpstackDeviceService,
    ],
})
export class AppModule {}
