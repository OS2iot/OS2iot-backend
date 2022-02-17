import { LoRaWANDevice } from "@entities/lorawan-device.entity";

export type LoRaWANDeviceId = Pick<LoRaWANDevice, "deviceEUI">;
