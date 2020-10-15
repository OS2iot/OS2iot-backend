import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsOptional, IsString, Length, Matches } from "class-validator";

import { ActivationType } from "@enum/lorawan-activation-type.enum";

import { ChirpstackDeviceContentsDto } from "./chirpstack/chirpstack-device-contents.dto";

export class CreateLoRaWANSettingsDto extends PickType(ChirpstackDeviceContentsDto, [
    "devEUI",
    "deviceProfileID",
    "serviceProfileID",
    "skipFCntCheck",
    "isDisabled",
]) {
    @ApiProperty({ required: true })
    activationType: ActivationType;

    /* OTAA */
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @Length(32, 32)
    @Matches(/[0-9A-Fa-f]{32}/)
    OTAAapplicationKey?: string;

    /* ABP */
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @Length(8, 8)
    @Matches(/[0-9A-Fa-f]{8}/)
    devAddr?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    fCntUp?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    nFCntDown?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @Length(32, 32)
    @Matches(/[0-9A-Fa-f]{32}/)
    networkSessionKey?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @Length(32, 32)
    @Matches(/[0-9A-Fa-f]{32}/)
    applicationSessionKey?: string;
}
