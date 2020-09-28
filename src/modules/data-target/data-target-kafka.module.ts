import { HttpModule, Module } from "@nestjs/common";

import { DataTargetKafkaListenerService } from "@services/data-targets/data-target-kafka-listener.service";
import { SharedModule } from "@modules/shared.module";
import { ApplicationModule } from "@modules/device-management/application.module";
import { DeviceIntegrationPersistenceModule } from "@modules/data-management/device-integration-persistence.module";
import { DataTargetSenderModule } from "@modules/data-target/data-target-sender.module";
import { DataTargetModule } from "@modules/device-management/data-target.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "@modules/device-management/iot-device-payload-decoder-data-target-connection.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { KafkaModule } from "@modules/kafka.module";

@Module({
    imports: [
        SharedModule,
        HttpModule,
        KafkaModule,
        DataTargetSenderModule,
        DeviceIntegrationPersistenceModule,
        IoTDeviceModule,
        ChirpstackAdministrationModule,
        IoTDevicePayloadDecoderDataTargetConnectionModule,
        ApplicationModule,
        DataTargetModule,
    ],
    providers: [DataTargetKafkaListenerService],
})
export class DataTargetKafkaModule {}
