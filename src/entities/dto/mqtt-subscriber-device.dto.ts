import { MQTTSubscriberDevice } from "@entities/mqtt-subscriber-device.entity";
import { MQTTDetails } from "@dto/mqtt-broker-device.dto";

export class MQTTSubscriberDeviceDTO extends MQTTSubscriberDevice {
    mqttSubscriberSettings: MQTTSubscriberSettingsDTO;
}

export class MQTTSubscriberSettingsDTO extends MQTTDetails {
    invalidMqttConfig: boolean;
}
