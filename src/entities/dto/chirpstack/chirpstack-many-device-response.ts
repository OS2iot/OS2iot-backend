export interface ChirpstackManyDeviceResponseContents {
    devEUI: string;
    name: string;
    applicationID: string;
    description: string;
    deviceProfileID: string;
    deviceProfileName: string;
    deviceStatusBattery: number;
    deviceStatusMargin: number;
    deviceStatusExternalPowerSource: boolean;
    deviceStatusBatteryLevelUnavailable: boolean;
    deviceStatusBatteryLevel: number;
    lastSeenAt?: Date;
}

export interface ChirpstackManyDeviceResponseDto {
    totalCount: string;
    result: ChirpstackManyDeviceResponseContents[];
}
