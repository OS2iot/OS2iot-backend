import { IoTDeviceType } from "@enum/device-type.enum";

export class RawRequestDto {
    type: IoTDeviceType[number];
    rawPayload: JSON;
    iotDeviceId: number;
    unixTimestamp?: number;
}
