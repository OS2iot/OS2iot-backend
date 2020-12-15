import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsHexadecimal, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Min, ValidateIf } from "class-validator";

import { ActivationType } from "@enum/lorawan-activation-type.enum";

import { ChirpstackDeviceContentsDto } from "./chirpstack/chirpstack-device-contents.dto";

export class CreateLoRaWANSettingsDto extends PickType(ChirpstackDeviceContentsDto, [
    "devEUI",
    "deviceProfileID",
    "serviceProfileID",
    "skipFCntCheck",
    "isDisabled",
    "deviceStatusBattery",
    "deviceStatusMargin",
]) {
    @ApiProperty({ required: true })
    activationType: ActivationType;

    /* OTAA */
    @ApiProperty({ required: false })
    @ValidateIf((o: CreateLoRaWANSettingsDto) => o.activationType == ActivationType.OTAA)
    @IsString()
    @Length(32, 32)
    @IsHexadecimal()
    OTAAapplicationKey?: string;

    /* ABP */
    @ApiProperty({ required: false })
    @ValidateIf((o: CreateLoRaWANSettingsDto) => o.activationType == ActivationType.ABP)
    @IsString()
    @Length(8, 8)
    @IsHexadecimal()
    devAddr?: string;

    @ApiProperty({ required: false })
    @ValidateIf((o: CreateLoRaWANSettingsDto) => o.activationType == ActivationType.ABP)
    @IsNumber()
    @IsInt()
    @Min(0)    
    fCntUp?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: CreateLoRaWANSettingsDto) => o.activationType == ActivationType.ABP)
    @IsNumber()
    @IsInt()
    @Min(0)
    nFCntDown?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: CreateLoRaWANSettingsDto) => o.activationType == ActivationType.ABP)
    @IsString()
    @Length(32, 32)
    @IsHexadecimal()
    networkSessionKey?: string;

    @ApiProperty({ required: false })
    @ValidateIf((o: CreateLoRaWANSettingsDto) => o.activationType == ActivationType.ABP)
    @IsString()
    @Length(32, 32)
    @IsHexadecimal()
    applicationSessionKey?: string;
}
