import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CreateSigFoxSettingsDto {
    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(8)
    @Matches(/[0-9A-Fa-f]{1,8}/)
    deviceId: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(24)
    @Matches(/[0-9A-Fa-f]{1,24}/)
    deviceTypeId?: string;
}
