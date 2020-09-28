import { ChirpstackDeviceContentsDto } from "@dto/chirpstack/chirpstack-device-contents.dto";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";

export class LoRaWANDeviceWithChirpstackDataDto extends LoRaWANDevice {
    lorawanSettings: ChirpstackDeviceContentsDto;
}
