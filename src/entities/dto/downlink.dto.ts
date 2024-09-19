export class DownlinkQueueDto {
  fCntDown: number;
  payload: string;
  port: number;
  sendAt: Date;
  acknowledgedAt: Date;
  acknowledged: boolean;
  createdAt: Date;
}

