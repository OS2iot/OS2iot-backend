import { Matches, IsString, IsOptional, Length } from "class-validator";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { ChirpstackDeviceContentsDto } from "./chirpstack/chirpstack-device-contents.dto";
import { ActivationType } from "@enum/lorawan-activation-type.enum";

export class CreateLoRaWANSettingsDto extends PickType(
    ChirpstackDeviceContentsDto,
    [
        "devEUI",
        "deviceProfileID",
        "deviceProfileID",
        "serviceProfileID",
        "skipFCntCheck",
        "isDisabled",
    ]
) {
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
