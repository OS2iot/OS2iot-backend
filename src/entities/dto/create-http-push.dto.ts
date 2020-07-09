import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateHttpPushDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(1024)
    targetUrl: string;

    @ApiProperty({ required: true })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    timeout: number;

    @ApiProperty({ required: true })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    authorizationHeader: string;
}
