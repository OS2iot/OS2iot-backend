export class DeviceStatsResponseDto {
    timestamp: string;
    rssi: number;
    snr: number;
    rxPacketsPerDr?: Record<number, number>;
}
