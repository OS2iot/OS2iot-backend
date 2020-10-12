export interface CreateChirpstackDeviceQueueItemDto {
    deviceQueueItem: DeviceQueueItem;
}

export interface DeviceQueueItem {
    fPort: number;
    data: string;
    confirmed: boolean;
    devEUI: string;
}

export interface CreateChirpstackDeviceQueueItemResponse {
    fCnt: number;
}