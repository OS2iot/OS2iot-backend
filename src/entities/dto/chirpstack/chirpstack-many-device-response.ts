export interface ChirpstackManyDeviceResponseContents {
    devEUI: string;
    name: string;
    description: string;
    deviceProfileID: string;
    deviceProfileName: string;
    deviceStatusBattery: number;
    deviceStatusMargin: number;
    deviceStatusExternalPowerSource: boolean;
    lastSeenAt?: Date;
}

export interface ChirpstackManyDeviceResponseDto {
    totalCount: string;
    result: ChirpstackManyDeviceResponseContents[];
}
