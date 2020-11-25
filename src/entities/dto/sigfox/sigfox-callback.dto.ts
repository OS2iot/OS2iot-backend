/**
 * Callback as expected from SigFox
 * Docs: https://support.sigfox.com/docs/uplink
 */
export class SigFoxCallbackDto {
    time: number;
    deviceTypeId: string;
    deviceId: string;
    data: string;
    seqNumber: number;
    // If true, then the device expects a downlink
    ack: boolean;

    // Only included in BIDIR
    longPolling?: boolean;

    // these are not available for all contracts "Condition: for devices with contract option NETWORK METADATA"
    // https://support.sigfox.com/docs/bidir
    // We cannot assume they'll exists
    snr?: number;
    rssi?: number;
    station?: string;
}
