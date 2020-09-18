import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { ChirpstackDeviceContentsDto } from "@dto/chirpstack/chirpstack-device-contents.dto";

export class LoRaWANDeviceWithChirpstackDataDto extends LoRaWANDevice {
    lorawanSettings: ChirpstackDeviceContentsDto;
}
