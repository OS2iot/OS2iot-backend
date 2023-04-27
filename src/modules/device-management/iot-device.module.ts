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

@Module({
    imports: [
        SharedModule,
        ChirpstackAdministrationModule,
        forwardRef(() => ApplicationModule),
        SigFoxGroupModule,
        SigfoxDeviceTypeModule,
        DeviceModelModule,
        forwardRef(() => SigfoxDeviceModule),
        forwardRef(() => IoTLoRaWANDeviceModule),
    ],
    exports: [IoTDeviceService],
    controllers: [IoTDeviceController, IoTDevicePayloadDecoderController],
    providers: [
        IoTDeviceService,
        PeriodicSigFoxCleanupService,
        IoTDeviceDownlinkService,
        SigFoxMessagesService,
        MqttService,
    ],
})
export class IoTDeviceModule {}
