export enum IoTDeviceType {
    GenericHttp = "GENERIC_HTTP",
    LoRaWAN = "LORAWAN",
    MQTTInternalBroker = "MQTT_INTERNAL_BROKER",
    MQTTExternalBroker = "MQTT_EXTERNAL_BROKER",
    SigFox = "SIGFOX",
}

enum ApplicationDeviceTypeExtra {
    Other = "OTHER",
}

export type ApplicationDeviceTypeUnion = IoTDeviceType | ApplicationDeviceTypeExtra;
// Enums cannot be extended like types
export const ApplicationDeviceTypes = { ...IoTDeviceType, ...ApplicationDeviceTypeExtra };
