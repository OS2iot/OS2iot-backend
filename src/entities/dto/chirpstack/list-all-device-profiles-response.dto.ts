import { DeviceProfileDto } from "./device-profile.dto";

export class ListAllDeviceProfilesReponseDto {
    result: DeviceProfileDto[];
    totalCount: string;
}
