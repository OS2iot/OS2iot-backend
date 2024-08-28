export interface MulticastQueueItem {
  multicastGroupId?: string;
  fCnt?: number;
  fPort?: number;
  data: string;
}

export interface MulticastDownlinkQueueResponseDto {
  deviceQueueItems: MulticastQueueItem[];
}
