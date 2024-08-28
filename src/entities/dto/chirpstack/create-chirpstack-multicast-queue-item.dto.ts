export interface CreateChirpstackMulticastQueueItemDto {
  multicastQueueItem: MulticastQueueItem;
}

export interface MulticastQueueItem {
  fPort: number;
  data: string;
  multicastGroupID: string;
}

export interface CreateChirpstackMulticastQueueItemResponse {
  fCnt: number;
}
