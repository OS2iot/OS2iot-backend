import { IoTDeviceType } from "@enum/device-type.enum";

export class RawRequestDto {
    type: IoTDeviceType[number];
    rawPayload: JSON;
    unixTimestamp?: number;
}
