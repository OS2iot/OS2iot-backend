import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { CreateLoRaWANSettingsDto } from "./create-lorawan-settings.dto";

export class LoRaWANDeviceWithChirpstackDataDto extends LoRaWANDevice {
    lorawanSettings: CreateLoRaWANSettingsDto;
}
