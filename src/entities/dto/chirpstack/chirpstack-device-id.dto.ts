import { ChirpstackDeviceContentsDto } from "./chirpstack-device-contents.dto";

export type ChirpstackDeviceId = Pick<ChirpstackDeviceContentsDto, "devEUI">;
