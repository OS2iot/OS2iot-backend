import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class DeviceProfileDto {
    @ApiProperty({ required: false })
    @IsOptional()
    id?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    name?: string;

    classBTimeout: number;
    classCTimeout: number;
    factoryPresetFreqs: [number];
    geolocBufferTTL: number;
    geolocMinBufferSize: number;

    macVersion: string;
    maxDutyCycle: number;
    maxEIRP: number;
    networkServerID: string;
    organizationID: string;
    payloadCodec: string;
    payloadDecoderScript: string;
    payloadEncoderScript: string;
    pingSlotDR: number;
    pingSlotFreq: number;
    pingSlotPeriod: number;
    regParamsRevision: string;
    rfRegion: string;
    rxDROffset1: number;
    rxDataRate2: number;
    rxDelay1: number;
    rxFreq2: number;
    supports32BitFCnt: boolean;
    supportsClassB: boolean;
    supportsClassC: boolean;
    supportsJoin: boolean;
}
