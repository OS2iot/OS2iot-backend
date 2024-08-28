export class LoRaWANStatsResponseDto {
  result: LoRaWANStatsElementDto[];
}

export class LoRaWANStatsElementDto {
  gwRssi: number;
  gwSnr: number;
  rxPacketsPerDr: Record<number, number>;
  timestamp: string;
}
