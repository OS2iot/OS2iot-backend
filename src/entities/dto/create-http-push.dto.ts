import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateHttpPushDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(1024)
    targetUrl: string;

    @ApiProperty({ required: true })
    timeout: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    authorizationHeader: string;
}
