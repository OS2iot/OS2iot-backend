import { Matches, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateLoRaWANSettingsDto {
    @ApiProperty({ required: true })
    @IsString()
    @Matches(/[0-9A-Fa-f]{16}/)
    deviceEUI: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsUUID()
    deviceProfileId: string;

    @ApiProperty({ required: false })
    @IsString()
    @Matches(/[0-9A-Fa-f]{16}/)
    OTAAapplicationKey: string;
}
