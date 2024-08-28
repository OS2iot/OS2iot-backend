import { ChirpstackDeviceContentsDto } from "@dto/chirpstack/chirpstack-device-contents.dto";

export class ListAllDevicesResponseDto {
  result: ChirpstackDeviceContentsDto[];
  totalCount: string;
}
