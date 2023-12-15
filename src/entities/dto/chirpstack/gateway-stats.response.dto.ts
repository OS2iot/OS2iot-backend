import { Metric } from "@chirpstack/chirpstack-api/common/common_pb";

export class GatewayStatsResponseDto {
    result: GatewayStatsElementDto[];
}

export class GatewayStatsElementDto {
    timestamp: string;
    rxPacketsReceived: number;
    txPacketsEmitted: number;
}
