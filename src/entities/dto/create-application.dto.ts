import { IsSwaggerOptional } from "@helpers/optional-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsJSON, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateApplicationDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @ApiProperty({ required: true })
    organizationId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    description?: string;

    @IsSwaggerOptional()
    @IsJSON()
    metadata?: JSON;
}
