export class ChirpstackMQTTMessageDto {
    adr: boolean;
    applicationID: string;
    applicationName: string;
    data: string;
    devEUI: string;
    deviceName: string;
    fCnt: number;
    fPort: number;
    txInfo: ChirpstackMQTTMessageTxInfoDto;
    dr: number;
    frequency: number;
}

export class ChirpstackMQTTMessageTxInfoDto {
    frequency: number;
    dr: number;
}
