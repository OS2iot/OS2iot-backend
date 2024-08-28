export class DeviceMetricsDto {
  [timestamp: string]: {
    rssi: number;
    snr: number;
    rxPacketsPerDr: Record<number, number>;
  };
}

export enum MetricProperties {
  rssi = "rssi",
  snr = "snr",
  dr = "rxPacketsPerDr",
}
