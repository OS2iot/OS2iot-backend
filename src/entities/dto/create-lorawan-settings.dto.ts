import { Matches, IsString, IsOptional } from "class-validator";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { ChirpstackDeviceContentsDto } from "./chirpstack/chirpstack-device-contents.dto";

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
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @Matches(/[0-9A-Fa-f]{16}/)
    OTAAapplicationKey: string;
}
