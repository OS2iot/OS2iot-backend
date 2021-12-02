export interface CreateChirpstackMulticastQueueItemDto {
    multicastQueueItem: MulticastQueueItem;
}

export interface MulticastQueueItem {
    fPort: number;
    data: string;
    multicastID: string;
}

export interface CreateChirpstackMulticastQueueItemResponse {
    fCnt: number;
}
