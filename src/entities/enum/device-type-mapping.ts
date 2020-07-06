import { IoTDeviceType } from "./device-type.enum";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";

export const iotDeviceTypeMap = {
    [IoTDeviceType.GenericHttp]: GenericHTTPDevice,
};
