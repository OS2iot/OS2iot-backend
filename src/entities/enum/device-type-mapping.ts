import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { MQTTInternalBrokerDevice } from "@entities/mqtt-internal-broker-device.entity";
import { MQTTExternalBrokerDevice } from "@entities/mqtt-external-broker-device.entity";

export const iotDeviceTypeMap = {
    [IoTDeviceType.GenericHttp]: GenericHTTPDevice,
    [IoTDeviceType.LoRaWAN]: LoRaWANDevice,
    [IoTDeviceType.SigFox]: SigFoxDevice,
    [IoTDeviceType.MQTTInternalBroker]: MQTTInternalBrokerDevice,
    [IoTDeviceType.MQTTExternalBroker]: MQTTExternalBrokerDevice,
};
