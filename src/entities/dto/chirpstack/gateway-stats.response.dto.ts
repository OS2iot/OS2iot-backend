export class GatewayStatsResponseDto {
    result: GatewayStatsElementDto[];
}

export class GatewayStatsElementDto {
    timestamp: string;
    rxPacketsReceived: number;
    rxPacketsReceivedOK: number;
    txPacketsReceived: number;
    txPacketsEmitted: number;
}
