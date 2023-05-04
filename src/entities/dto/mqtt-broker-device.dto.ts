import { MQTTBrokerDevice } from "@entities/mqtt-broker-device.entity";
import { AuthenticationType } from "@enum/authentication-type.enum";
import { MQTTPermissionLevel } from "@enum/mqtt-permission-level.enum";

export class MQTTBrokerDeviceDTO extends MQTTBrokerDevice {
    mqttBrokerSettings: MQTTDetails;
}

export class MQTTDetails {
    authenticationType: AuthenticationType;
    permissions: MQTTPermissionLevel;
    caCertificate: string;
    deviceCertificate: string;
    deviceCertificateKey: string;
    mqttusername: string;
    mqttpassword: string;
    mqttURL: string;
    mqttPort: number;
    mqtttopicname: string;
}
