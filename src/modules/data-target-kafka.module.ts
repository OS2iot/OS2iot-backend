import { HttpModule, Module } from "@nestjs/common";

import { DataTargetKafkaListenerService } from "@services/data-targets/data-target-kafka-listener.service";
import { SharedModule } from "@modules/shared.module";
import { ApplicationModule } from "./application.module";
import { DeviceIntegrationPersistenceModule } from "./data-management/device-integration-persistence.module";
import { DataTargetSenderModule } from "./data-target-sender.module";
import { DataTargetModule } from "./data-target.module";
import { ChirpstackAdministrationModule } from "./device-integrations/chirpstack-administration.module";
import { IoTDevicePayloadDecoderDataTargetConnectionModule } from "./iot-device-payload-decoder-data-target-connection.module";
import { IoTDeviceModule } from "./iot-device.module";
import { KafkaModule } from "./kafka.module";

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
