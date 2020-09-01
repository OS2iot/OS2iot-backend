import { IoTDeviceType } from "@enum/device-type.enum";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";

export const iotDeviceTypeMap = {
    [IoTDeviceType.GenericHttp]: GenericHTTPDevice,
    [IoTDeviceType.LoRaWAN]: LoRaWANDevice,
};
