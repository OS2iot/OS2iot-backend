export class ChirpstackDeviceKeysResponseDto {
    deviceKeys: ChirpstackDeviceKeysContentDto;
}

export class ChirpstackDeviceKeysContentDto {
    devEUI: string;
    nwkKey: string;
    appKey: string;
}
