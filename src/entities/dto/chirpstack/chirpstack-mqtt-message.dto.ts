export class ChirpstackMqttMessageDto {
  adr: boolean;
  data: string;
  fCnt: number;
  fPort: number;
  deviceInfo: ChirpstackMqttMessageDeviceInfo;
  txInfo: ChirpstackMqttMessageTxInfoDto;
  dr: number;
  frequency: number;
  confirmed: boolean;
}

export class ChirpstackMqttMessageTxInfoDto {
  frequency: number;
  dr: number;
}

export class ChirpstackMqttConnectionStateMessageDto {
  gatewayId: string;
  isOnline: boolean;
}

export class ChirpstackMqttMessageDeviceInfo {
  applicationID: string;
  applicationName: string;
  devEui: string;
  deviceName: string;
}

export class ChirpstackMqttTxAckMessageDto {
  queueItemId: string;
  time: Date;
  deviceInfo: ChirpstackMqttMessageDeviceInfo;
  fCntDown: number;
}

export class ChirpstackMqttAckMessageDto {
  acknowledged: boolean;
  queueItemId: string;
  time: Date;
  deviceInfo: ChirpstackMqttMessageDeviceInfo;
  fCntDown: number;
}
