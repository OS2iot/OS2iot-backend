/**
 * Callback as expected from SigFox
 * Docs: https://support.sigfox.com/docs/uplink
 */
export class SigFoxCallbackDto {
    time: number;
    deviceTypeId: string;
    deviceId: string;
    snr: number;
    rssi: number;
    station: string;
    data: string;
    seqNumber: number;

    // Only included in BIDIR
    longPolling?: boolean;
    // Only included in BIDIR
    ack?: boolean;
}
