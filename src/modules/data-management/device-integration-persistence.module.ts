import { Module, HttpModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { DataTarget } from "@entities/data-target.entity";
import { DeviceIntegrationPersistenceService } from "@services/data-management/device-integration-persistence.service";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { ReceivedMessage } from "@entities/received-message";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { IoTDeviceService } from "@services/iot-device.service";
import { ApplicationModule } from "@modules/application.module";
import { ApplicationService } from "@services/application.service";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            IoTDevice,
            DataTarget,
            ReceivedMessage,
            ReceivedMessageMetadata,
        ]),
        IoTDeviceModule,
        ApplicationModule,
        ChirpstackAdministrationModule,
        HttpModule,
    ],
    exports: [TypeOrmModule],
    controllers: [],
    providers: [
        DeviceIntegrationPersistenceService,
        IoTDeviceService,
        ApplicationService,
        ChirpstackDeviceService,
    ],
})
export class DeviceIntegrationPersistenceModule {}
