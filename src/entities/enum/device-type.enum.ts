import { GenericHTTPDevice } from "@entities/generic-http-device.entity";

export enum IoTDeviceType {
    GenericHttp = "GENERIC_HTTP",
}

export const iotDeviceTypeMap = {
    [IoTDeviceType.GenericHttp]: GenericHTTPDevice,
};
