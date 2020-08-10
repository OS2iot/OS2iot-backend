import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class ServiceProfileDto {
    @ApiProperty({ required: false })
    @IsString()
    id?: string;

    @ApiProperty({ required: true })
    @IsString()
    name: string;

    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(1024)
    networkServerID?: string;

    @ApiProperty({ required: false })
    addGWMetaData?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @MaxLength(1024)
    channelMask?: string;

    @ApiProperty({ required: false })
    devStatusReqFreq?: number;

    @ApiProperty({ required: false })
    dlBucketSize?: number;

    @ApiProperty({ required: false })
    dlRate?: number;

    @ApiProperty({ required: false })
    @IsString()
    @MaxLength(1024)
    dlRatePolicy?: string;

    @ApiProperty({ required: false })
    drMax?: number;

    @ApiProperty({ required: true })
    drMin?: number;

    @ApiProperty({ required: false })
    hrAllowed?: boolean;

    @ApiProperty({ required: false })
    minGWDiversity?: number;

    @ApiProperty({ required: false })
    nwkGeoLoc?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @MaxLength(1024)
    organizationID?: string;

    @ApiProperty({ required: false })
    prAllowed?: boolean;

    @ApiProperty({ required: false })
    raAllowed?: boolean;

    @ApiProperty({ required: false })
    reportDevStatusBattery?: boolean;

    @ApiProperty({ required: false })
    reportDevStatusMargin?: boolean;

    @ApiProperty({ required: true })
    targetPER?: number;

    @ApiProperty({ required: false })
    ulBucketSize?: number;

    @ApiProperty({ required: false })
    ulRate?: number;

    @ApiProperty({ required: false })
    @IsString()
    @MaxLength(1024)
    ulRatePolicy?: string;
}
