import { DeviceProfileDto } from "./device-profile.dto";

export class ListAllDeviceProfilesResponseDto {
  result: DeviceProfileListDto[];
  totalCount: string;
}

export class DeviceProfileListDto {
  id: string;
  name: string;
  createdAt: Date;
  createdBy?: number;
  internalOrganizationId?: number;
  updatedAt: Date;
  updatedBy?: number;
}
