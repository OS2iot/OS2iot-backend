export interface MulticastQueueItem {
    devEUI?: string;
    confirmed?: boolean;
    fCnt?: number;
    fPort?: number;
    data: string;
    jsonObject?: string;
}

export interface MulticastDownlinkQueueResponseDto {
    deviceQueueItems: MulticastQueueItem[];
    totalCount: number;
}
