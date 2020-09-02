import { Module } from "@nestjs/common";
import { ChirpstackMQTTListenerService } from "@services/data-management/chirpstack-mqtt-listener.service";
import { ReceiveDataModule } from "@modules/receive-data.module";
import { IoTDeviceModule } from "@modules/iot-device.module";

@Module({
    imports: [ReceiveDataModule, IoTDeviceModule],
    providers: [ChirpstackMQTTListenerService],
    exports: [ChirpstackMQTTListenerService],
})
export class ChirpstackMqttListenerModule {}
