export interface DeviceQueueItem {
    devEUI: string;
    confirmed: boolean;
    fCnt: number;
    fPort: number;
    data: string;
    jsonObject: string;
}

export interface ChirstackDeviceDownlinkQueueResponseDto {
    deviceQueueItems: DeviceQueueItem[];
    totalCount: number;
}
