import { DeviceIntegrationPersistenceModule } from "@modules/data-management/device-integration-persistence.module";
import { GatewayPersistenceModule } from "@modules/data-management/gateway-persistence.module";
import { DataTargetSenderModule } from "@modules/data-target/data-target-sender.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ApplicationModule } from "@modules/device-management/application.module";
import { DataTargetModule } from "@modules/device-management/data-target.module";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/device-management/iot-device-payload-decoder-data-target-connection.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { KafkaModule } from "@modules/kafka.module";
import { SharedModule } from "@modules/shared.module";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { DataTargetKafkaListenerService } from "@services/data-targets/data-target-kafka-listener.service";
import { DataTargetFiwareSenderModule } from "./data-target-fiware-sender.module";

@Module({
    imports: [
        SharedModule,
        HttpModule,
        KafkaModule,
        DataTargetSenderModule,
        DataTargetFiwareSenderModule,
        DeviceIntegrationPersistenceModule,
        IoTDeviceModule,
        ChirpstackAdministrationModule,
        IoTDevicePayloadDecoderDataTargetConnectionModule,
        ApplicationModule,
        DataTargetModule,
        GatewayPersistenceModule,
    ],
    providers: [DataTargetKafkaListenerService],
})
export class DataTargetKafkaModule {}
