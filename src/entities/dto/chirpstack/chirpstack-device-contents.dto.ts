import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { IsHexadecimal, IsOptional, IsString, IsUUID, Length, Matches } from "class-validator";

export class ChirpstackDeviceContentsDto {
    @ApiHideProperty()
    name?: string;

    @ApiHideProperty()
    description?: string;

    @ApiHideProperty()
    applicationID?: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsHexadecimal()
    @Length(16,16)
    devEUI: string;

    @ApiProperty({ required: true })
    @IsUUID()
    deviceProfileID: string;

    @ApiProperty({ required: true })
    @IsUUID()
    serviceProfileID: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    isDisabled?: boolean;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    skipFCntCheck?: boolean;

    @ApiProperty({ required: false, default: {} })
    variables?: JSON;

    @ApiProperty({ required: false, default: {} })
    tags?: JSON;

    @ApiProperty({ required: false, default: {} })
    OTAAapplicationKey: string;

    @ApiHideProperty()
    deviceStatusBattery?: number;
    @ApiHideProperty()
    deviceStatusMargin?: number;
}
