import { MQTTBrokerDevice } from "@entities/mqtt-broker-device.entity";
import { AuthenticationType } from "@enum/authentication-type.enum";

export class MQTTBrokerDeviceDTO extends MQTTBrokerDevice {
    mqttBrokerSettings: MQTTDetails;
}

export class MQTTDetails {
    authenticationType: AuthenticationType;
    certificate: string;
    mqttUsername: string;
    mqttPassword: string;
    mqttURL: string;
    mqttTopicName: string;
}
