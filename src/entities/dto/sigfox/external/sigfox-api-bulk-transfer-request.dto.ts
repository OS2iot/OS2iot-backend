export interface SigFoxApiBulkTransferRequestDto {
  deviceTypeId: string;
  data: SigFoxApiBulkTransferDeviceSettings[];
}

export interface SigFoxApiBulkTransferDeviceSettings {
  id: string;
  keepHistory: boolean;
  activable: boolean;
}
