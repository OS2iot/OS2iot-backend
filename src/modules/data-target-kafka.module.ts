import { Module, HttpModule } from "@nestjs/common";
import { DataTargetKafkaListenerService } from "@services/data-targets/data-target-kafka-listener.service";
import { KafkaModule } from "@modules/kafka.module";
import { IoTDeviceService } from "@services/iot-device.service";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationService } from "@services/application.service";
import { DataTargetService } from "@services/data-target.service";
import { DataTarget } from "@entities/data-target.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { DataTargetSenderModule } from "@modules/data-target-sender.module";
import { IoTDeviceModule } from "./iot-device.module";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { DeviceIntegrationPersistenceModule } from "@modules/data-management/device-integration-persistence.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            IoTDevice,
            GenericHTTPDevice,
            DataTarget,
            HttpPushDataTarget,
            ReceivedMessage,
            ReceivedMessageMetadata,
        ]),
        HttpModule,
        KafkaModule,
        DataTargetSenderModule,
        DeviceIntegrationPersistenceModule,
        IoTDeviceModule,
        ChirpstackAdministrationModule,
    ],
    providers: [
        IoTDeviceService,
        ApplicationService,
        DataTargetService,
        DataTargetKafkaListenerService,
    ],
})
export class DataTargetKafkaModule {}
