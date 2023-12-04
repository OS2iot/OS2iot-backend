import { forwardRef, Module } from "@nestjs/common";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { ApplicationModule } from "@modules/device-management/application.module";
import { SharedModule } from "@modules/shared.module";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { SigfoxDeviceModule } from "@modules/device-integrations/sigfox-device.module";
import { SigFoxGroupModule } from "@modules/device-integrations/sigfox-group.module";
import { SigfoxDeviceTypeModule } from "@modules/device-integrations/sigfox-device-type.module";
import { PeriodicSigFoxCleanupService } from "@services/sigfox/periodic-sigfox-cleanup.service";
import { IoTDeviceDownlinkService } from "@services/device-management/iot-device-downlink.service";
import { DeviceModelModule } from "./device-model.module";
import { IoTDevicePayloadDecoderController } from "@admin-controller/iot-device-payload-decoder.controller";
import { IoTLoRaWANDeviceModule } from "./iot-lorawan-device.module";
import { SigFoxMessagesService } from "@services/sigfox/sigfox-messages.service";
import { MqttService } from "@services/mqtt/mqtt.service";
import { ReceiveDataModule } from "@modules/device-integrations/receive-data.module";
import { InternalMqttListenerModule } from "@modules/device-integrations/internal-mqtt-listener.module";
import { EncryptionHelperService } from "@services/encryption-helper.service";
import { CsvGeneratorService } from "@services/csv-generator.service";
import { LorawanDeviceDatabaseEnrichJob } from "@services/device-management/lorawan-device-database-enrich-job";

@Module({
    imports: [
        SharedModule,
        ChirpstackAdministrationModule,
        forwardRef(() => ApplicationModule),
        SigFoxGroupModule,
        SigfoxDeviceTypeModule,
        DeviceModelModule,
        ReceiveDataModule,
        forwardRef(() => SigfoxDeviceModule),
        forwardRef(() => IoTLoRaWANDeviceModule),
        InternalMqttListenerModule,
    ],
    exports: [MqttService, IoTDeviceService],
    controllers: [IoTDeviceController, IoTDevicePayloadDecoderController],
    providers: [
        PeriodicSigFoxCleanupService,
        IoTDeviceDownlinkService,
        SigFoxMessagesService,
        LorawanDeviceDatabaseEnrichJob,
        MqttService,
        IoTDeviceService,
        EncryptionHelperService,
        CsvGeneratorService,
    ],
})
export class IoTDeviceModule {}
