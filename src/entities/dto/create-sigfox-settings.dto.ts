import { Matches, IsString, IsOptional, Length, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSigFoxSettingsDto {
    @ApiProperty({ required: true })
    @IsString()
    @Max(8)
    @Matches(/[0-9A-Fa-f]{1,8}/)
    deviceId: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @Max(24)
    @Matches(/[0-9A-Fa-f]{1,24}/)
    deviceTypeId?: string;
}
