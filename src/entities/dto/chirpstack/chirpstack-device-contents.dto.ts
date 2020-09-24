import { IsUUID, IsString, IsOptional, Matches } from "class-validator";
import { ApiProperty, ApiHideProperty } from "@nestjs/swagger";

export class ChirpstackDeviceContentsDto {
    @ApiHideProperty()
    name?: string;

    @ApiHideProperty()
    description?: string;

    @ApiHideProperty()
    applicationID?: string;

    @ApiProperty({ required: true })
    @IsString()
    @Matches(/[0-9A-Fa-f]{16}/)
    devEUI: string;

    @ApiProperty({ required: true })
    @IsUUID()
    deviceProfileID: string;

    @ApiProperty({ required: true })
    @IsUUID()
    serviceProfileID: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    isDisabled: boolean;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    skipFCntCheck: boolean;

    @ApiProperty({ required: false, default: {} })
    variables?: JSON;

    @ApiProperty({ required: false, default: {} })
    tags?: JSON;

    @ApiProperty({ required: false, default: {} })
    OTAAapplicationKey: string;
}
