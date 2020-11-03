import { DeviceProfileDto } from "./device-profile.dto";

export class ListAllDeviceProfilesResponseDto {
    result: DeviceProfileDto[];
    totalCount: string;
}
