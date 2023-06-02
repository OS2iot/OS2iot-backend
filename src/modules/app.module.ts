import configuration from "@config/configuration";
import { PayloadDecoderKafkaModule } from "@modules/data-management/payload-decoder-kafka.module";
import { DataTargetKafkaModule } from "@modules/data-target/data-target-kafka.module";
import { DataTargetSenderModule } from "@modules/data-target/data-target-sender.module";
import { DefaultModule } from "@modules/default.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ChirpstackMqttListenerModule } from "@modules/device-integrations/chirpstack-mqtt-listener.module";
import { ReceiveDataModule } from "@modules/device-integrations/receive-data.module";
import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";
import { SigfoxContractModule } from "@modules/device-integrations/sigfox-contract.module";
import { SigfoxDeviceTypeModule } from "@modules/device-integrations/sigfox-device-type.module";
import { SigfoxDeviceModule } from "@modules/device-integrations/sigfox-device.module";
import { SigFoxGroupModule } from "@modules/device-integrations/sigfox-group.module";
import { SigFoxListenerModule } from "@modules/device-integrations/sigfox-listener.module";
import { ApplicationModule } from "@modules/device-management/application.module";
import { DataTargetModule } from "@modules/device-management/data-target.module";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/device-management/iot-device-payload-decoder-data-target-connection.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { PayloadDecoderModule } from "@modules/device-management/payload-decoder.module";
import { KafkaModule } from "@modules/kafka.module";
import { AuthModule } from "@modules/user-management/auth.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { PermissionModule } from "@modules/user-management/permission.module";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiKeyInfoModule } from "./api-key-info/api-key-info.module";
import { DeviceModelModule } from "./device-management/device-model.module";
import { IoTLoRaWANDeviceModule } from "./device-management/iot-lorawan-device.module";
import { MulticastModule } from "./device-management/multicast.module";
import { OpenDataDkSharingModule } from "./open-data-dk-sharing.module";
import { SearchModule } from "./search.module";
import { TestPayloadDecoderModule } from "./test-payload-decoder.module";
import { NewKombitCreationModule } from "./user-management/new-kombit-creation.module";
import { InternalMqttListenerModule } from "@modules/device-integrations/internal-mqtt-listener.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: "postgres",
                host: configService.get<string>("database.host"),
                port: configService.get<number>("database.port"),
                username: configService.get<string>("database.username"),
                password: configService.get<string>("database.password"),
                database: "os2iot",
                // Don't sync database 1-1 with code. Make migrations necessary
                synchronize: false,
                logging: false,
                autoLoadEntities: true,
                retryAttempts: 0,
                maxQueryExecutionTime: 1000, // Log queries slower than 1000 ms
                ssl: configService.get<boolean>("database.ssl"),
            }),
        }),
        KafkaModule,
        ScheduleModule.forRoot(),
        HttpModule,
        ApplicationModule,
        IoTDeviceModule,
        DeviceModelModule,
        DataTargetModule,
        DataTargetKafkaModule,
        DataTargetSenderModule,
        ReceiveDataModule,
        ChirpstackAdministrationModule,
        PayloadDecoderModule,
        IoTDevicePayloadDecoderDataTargetConnectionModule,
        ChirpstackMqttListenerModule,
        InternalMqttListenerModule,
        PayloadDecoderKafkaModule,
        DefaultModule,
        AuthModule,
        OrganizationModule,
        PermissionModule,
        SigFoxListenerModule,
        SigFoxAdministrationModule,
        SigFoxGroupModule,
        SigfoxDeviceTypeModule,
        SigfoxContractModule,
        SigfoxDeviceModule,
        SearchModule,
        TestPayloadDecoderModule,
        OpenDataDkSharingModule,
        MulticastModule,
        IoTLoRaWANDeviceModule,
        ApiKeyInfoModule,
        NewKombitCreationModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
