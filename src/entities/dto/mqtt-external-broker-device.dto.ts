import { MQTTExternalBrokerDevice } from "@entities/mqtt-external-broker-device.entity";
import { MQTTDetails } from "@dto/mqtt-internal-broker-device.dto";

export class MQTTExternalBrokerDeviceDTO extends MQTTExternalBrokerDevice {
    mqttExternalBrokerSettings: MQTTExternalBrokerSettingsDTO;
}

export class MQTTExternalBrokerSettingsDTO extends MQTTDetails {
    invalidMqttConfig: boolean;
}
