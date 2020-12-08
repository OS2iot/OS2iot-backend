import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import {
    IsArray,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Length,
    Min,
    ValidateIf,
} from "class-validator";

export class DeviceProfileDto {
    @ApiProperty({ required: true })
    @IsString()
    @Length(1, 1024)
    name: string;

    @ApiProperty({ required: true })
    macVersion: "1.0.0" | "1.0.1" | "1.0.2" | "1.0.3" | "1.1.0";

    @ApiProperty({ required: true })
    @IsInt()
    @Min(0)
    maxEIRP: number;

    @ApiProperty({ required: true })
    regParamsRevision: "A" | "B";

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsClassB)
    @Min(0)
    @IsInt()
    classBTimeout?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Min(0)
    @IsInt()
    classCTimeout?: number;

    @ApiProperty({ required: true })
    @IsInt()
    @Min(0)
    geolocBufferTTL: number;

    @ApiProperty({ required: true })
    @IsInt()
    @Min(0)
    geolocMinBufferSize: number;

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
    @ValidateIf((o: DeviceProfileDto) => o.supportsClassB)
    @Min(0)
    @IsInt()
    pingSlotDR?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsClassB)
    @Min(0)
    @IsInt()
    pingSlotFreq?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    pingSlotPeriod?: number;

    @ApiProperty({ required: false })
    rfRegion?: string;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsJoin == false)
    @Min(0)
    @IsInt()
    rxDROffset1?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsJoin == false)
    @Min(0)
    @IsInt()
    rxDataRate2?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsJoin == false)
    @Min(0)
    @IsInt()
    rxDelay1?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsJoin == false)
    @Min(0)
    @IsInt()
    rxFreq2?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsJoin == false)
    @IsArray()
    @IsNumber({ maxDecimalPlaces: 0 }, { each: true })
    factoryPresetFreqs: number[];

    @ApiProperty({ required: false })
    supports32BitFCnt?: boolean;

    @ApiProperty({ required: false })
    supportsClassB?: boolean;

    @ApiProperty({ required: false })
    supportsClassC?: boolean;

    @ApiProperty({ required: false })
    supportsJoin?: boolean;

    @ApiHideProperty()
    tags?: { [id: string]: string | number };

    @ApiHideProperty()
    internalOrganizationId?: number;

    @ApiHideProperty()
    updatedBy?: number;

    @ApiHideProperty()
    createdBy?: number;
}
