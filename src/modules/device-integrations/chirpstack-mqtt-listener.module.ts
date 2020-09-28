import { Module } from "@nestjs/common";

import { ReceiveDataModule } from "@modules/device-integrations/receive-data.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { ChirpstackMQTTListenerService } from "@services/data-management/chirpstack-mqtt-listener.service";

@Module({
    imports: [ReceiveDataModule, IoTDeviceModule],
    providers: [ChirpstackMQTTListenerService],
    exports: [ChirpstackMQTTListenerService],
})
export class ChirpstackMqttListenerModule {}
