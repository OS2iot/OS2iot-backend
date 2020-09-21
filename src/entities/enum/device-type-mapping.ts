import { IoTDeviceType } from "@enum/device-type.enum";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";

export const iotDeviceTypeMap = {
    [IoTDeviceType.GenericHttp]: GenericHTTPDevice,
    [IoTDeviceType.LoRaWAN]: LoRaWANDevice,
    [IoTDeviceType.SigFox]: SigFoxDevice,
};
