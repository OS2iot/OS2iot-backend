export class ChirpstackMQTTMessageDto {
    adr: boolean;
    data: string;
    fCnt: number;
    fPort: number;
    deviceInfo: ChirpstackMQTTMessageDeviceInfo;
    txInfo: ChirpstackMQTTMessageTxInfoDto;
    dr: number;
    frequency: number;
    confirmed: boolean
}

export class ChirpstackMQTTMessageTxInfoDto {
    frequency: number;
    dr: number;
}

export class ChirpstackMQTTConnectionStateMessageDto {
    gatewayId: string;
    isOnline: boolean;
}

export class ChirpstackMQTTMessageDeviceInfo {
    applicationID: string;
    applicationName: string;
    devEui: string;
    deviceName: string;
}
