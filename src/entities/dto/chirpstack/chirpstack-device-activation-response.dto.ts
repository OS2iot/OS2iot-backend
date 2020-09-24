export class ChirpstackDeviceActivationDto {
    deviceActivation: ChirpstackDeviceActivationContentsDto;
}

export class ChirpstackDeviceActivationContentsDto {
    devEUI: string;
    devAddr: string;
    appSKey: string;
    nwkSEncKey: string;
    sNwkSIntKey: string;
    fNwkSIntKey: string;
    fCntUp: number;
    nFCntDown: number;
    aFCntDown: number;
}
