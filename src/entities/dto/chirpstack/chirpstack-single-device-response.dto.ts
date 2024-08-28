import { ChirpstackDeviceContentsDto } from "./chirpstack-device-contents.dto";

export class ChirpstackSingleDeviceResponseDto {
  device: ChirpstackDeviceContentsDto;

  lastSeenAt: string;

  deviceStatusBattery: number;

  deviceStatusMargin: number;
}
