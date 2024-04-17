import { IoTDeviceType } from "@enum/device-type.enum";
import { Point } from "geojson";

export class IoTDevicesListToMapResponseDto {
    id: number;
    name: string;
    type: IoTDeviceType;
    latestSentMessage: Date;
    location: Point;
}
