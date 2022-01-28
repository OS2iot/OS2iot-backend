import { IsNumber, IsOptional, IsString } from "class-validator";

/**
 * Callback as expected from SigFox
 * Docs: https://support.sigfox.com/docs/uplink
 */
export class SigFoxCallbackDto {
    @IsNumber()
    time: number;
    @IsString()
    deviceTypeId: string;
    @IsString()
    deviceId: string;
    @IsString()
    data: string;
    @IsNumber()
    seqNumber: number;
    // If true, then the device expects a downlink
    ack: boolean;

    // Only included in BIDIR
    @IsOptional()
    longPolling?: boolean;

    // these are not available for all contracts "Condition: for devices with contract option NETWORK METADATA"
    // https://support.sigfox.com/docs/bidir
    // We cannot assume they'll exists
    @IsOptional()
    @IsNumber()
    snr?: number;
    @IsOptional()
    @IsNumber()
    rssi?: number;
    @IsOptional()
    @IsString()
    station?: string;
}
