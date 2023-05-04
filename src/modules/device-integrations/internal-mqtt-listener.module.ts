import { forwardRef, Module } from "@nestjs/common";
import { ReceiveDataModule } from "@modules/device-integrations/receive-data.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { SharedModule } from "@modules/shared.module";
import { InternalMqttClientListenerService } from "@services/data-management/internal-mqtt-client-listener.service";
import { InternalMqttBrokerListenerService } from "@services/data-management/internal-mqtt-broker-listener.service";

@Module({
    imports: [ReceiveDataModule, forwardRef(() => IoTDeviceModule), SharedModule],
    providers: [InternalMqttClientListenerService, InternalMqttBrokerListenerService],
    exports: [InternalMqttClientListenerService, InternalMqttBrokerListenerService],
})
export class InternalMqttListenerModule {}
