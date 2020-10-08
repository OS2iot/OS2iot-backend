export interface CreateSigFoxApiCallbackRequestDto {
    channel: string;
    callbackType: number;
    callbackSubtype: number;
    payloadConfig: string;
    enabled: boolean;
    url: string;
    httpMethod: string;
    headers?: any;
    sendSni: boolean;
    bodyTemplate: string;
    contentType: string;
}
