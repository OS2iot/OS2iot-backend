import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsPositive, IsString, Length, Min } from "class-validator";

export class DeviceProfileDto {
    @ApiProperty({ required: true })
    @IsString()
    @Length(1, 1024)
    name: string;

    @ApiProperty({ required: true })
    macVersion: "1.0.0" | "1.0.1" | "1.0.2" | "1.0.3" | "1.1.0";

    @ApiProperty({ required: true })
    @Min(0)
    maxEIRP: number;

    @ApiProperty({ required: true })
    regParamsRevision: "A" | "B";

    @ApiProperty({ required: false })
    classBTimeout?: number;

    @ApiProperty({ required: false })
    classCTimeout?: number;

    @ApiProperty({ required: false })
    factoryPresetFreqs?: number[];

    @ApiProperty({ required: false })
    @IsOptional()
    @Min(0)
    geolocBufferTTL?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Min(0)
    geolocMinBufferSize?: number;

    @ApiProperty({ required: false })
    maxDutyCycle?: number;

    @ApiProperty({ required: false })
    id?: string;

    @ApiHideProperty()
    networkServerID?: string;

    @ApiHideProperty()
    organizationID?: string;

    @ApiProperty({ required: false })
    payloadCodec?: string;

    @ApiProperty({ required: false })
    payloadDecoderScript?: string;

    @ApiProperty({ required: false })
    payloadEncoderScript?: string;

    @ApiProperty({ required: false })
    @ApiProperty({ required: false })
    pingSlotDR?: number;

    @ApiProperty({ required: false })
    pingSlotFreq?: number;

    @ApiProperty({ required: false })
    pingSlotPeriod?: number;

    @ApiProperty({ required: false })
    rfRegion?: string;

    @ApiProperty({ required: false })
    rxDROffset1?: number;

    @ApiProperty({ required: false })
    rxDataRate2?: number;

    @ApiProperty({ required: false })
    rxDelay1?: number;

    @ApiProperty({ required: false })
    rxFreq2?: number;

    @ApiProperty({ required: false })
    supports32BitFCnt?: boolean;

    @ApiProperty({ required: false })
    supportsClassB?: boolean;

    @ApiProperty({ required: false })
    supportsClassC?: boolean;

    @ApiProperty({ required: false })
    supportsJoin?: boolean;
}
