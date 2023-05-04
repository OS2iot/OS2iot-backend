import { MQTTSubscriberDevice } from "@entities/mqtt-subscriber-device.entity";
import { MQTTDetails } from "@dto/mqtt-broker-device.dto";

export class MQTTSubscriberDeviceDTO extends MQTTSubscriberDevice {
    mqttSubscriberSettings: MQTTSubscriberDetails;
}

export class MQTTSubscriberDetails extends MQTTDetails {}
