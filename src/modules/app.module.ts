import { Module, HttpModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
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
import configuration from "../config/configuration";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                type: "postgres" as const,
                host: configService.get<string>("database.host"),
                port: configService.get<number>("database.port"),
                username: configService.get<string>("database.username"),
                password: configService.get<string>("database.password"),
                database: "os2iot",
                synchronize: true,
                logging: false,
                autoLoadEntities: true,
                retryAttempts: 0,
                maxQueryExecutionTime: 200, // Log queries slower than 200 ms
            }),
        }),
        KafkaModule.register({
            clientId: process.env.KAFKA_CLIENTID || "os2iot-client",
            brokers: [
                `${process.env.KAFKA_HOSTNAME || "host.docker.internal"}:${
                    process.env.KAFKA_PORT || "9093"
                }`,
            ],
            groupId: process.env.KAFKA_GROUPID || "os2iot-backend",
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
