export interface SigFoxApiCallbacksResponseDto {
  data: SigFoxApiCallbackContent[];
}

export interface SigFoxApiCallbackContent {
  id: string;
  channel: string;
  callbackType: number;
  payloadConfig: string;
  callbackSubtype: number;
  enabled: boolean;
  dead: boolean;
  downlinkHook: boolean;
  url: string;
  contentType: string;
  httpMethod: string;
  sendSni: boolean;
  headers: any;
  linePattern: string;
  recipient: string;
  subject: string;
  message: string;
  bodyTemplate: string;
}
