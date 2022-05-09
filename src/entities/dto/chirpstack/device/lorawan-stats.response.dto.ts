export class LoRaWANStatsResponseDto {
    result: LoRaWANStatsElementDto[];
}

export class LoRaWANStatsElementDto {
    errors: Record<string, number>;
    gwRssi: number;
    gwSnr: number;
    rxPackets: number;
    rxPacketsPerDr: Record<number, number>;
    rxPacketsPerFrequency: Record<number, number>;
    timestamp: string;
}
