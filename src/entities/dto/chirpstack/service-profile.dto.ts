import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsString, Length, Max, MaxLength, Min } from "class-validator";

export class ServiceProfileDto {
    @ApiProperty({ required: false })
    id?: string;

    @ApiProperty({ required: true })
    @Length(1, 1024)
    name: string;

    @ApiHideProperty()
    networkServerID?: string;

    @ApiHideProperty()
    addGWMetaData = true;

    @ApiProperty({ required: false })
    channelMask?: string;

    @ApiProperty({ required: false })
    devStatusReqFreq?: number;

    @ApiProperty({ required: false })
    dlBucketSize?: number;

    @ApiProperty({ required: false })
    dlRate?: number;

    @ApiProperty({ required: false })
    dlRatePolicy?: string;

    @ApiProperty({ required: false })
    @IsInt()
    @Min(0, { message: "Max data rate må ikke være negativ" })
    @Max(7, { message: "Max data rate må ikke være større end 7" })
    drMax?: number;

    @ApiProperty({ required: true })
    @IsInt()
    @Min(0, { message: "Min data rate må ikke være negativ" })
    @Max(7, { message: "Min data rate må ikke være større end 7" })
    drMin?: number;

    @ApiProperty({ required: false })
    hrAllowed?: boolean;

    @ApiProperty({ required: false })
    minGWDiversity?: number;

    @ApiHideProperty()
    nwkGeoLoc = true;

    @ApiHideProperty()
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
    ulRatePolicy?: string;
}
