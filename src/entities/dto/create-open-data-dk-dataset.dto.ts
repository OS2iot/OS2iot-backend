import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateOpenDataDkDatasetDto {
    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @IsString({ each: true, always: true })
    keywords?: string[];

    @ApiProperty({ required: true })
    @IsString()
    @IsUrl({ protocols: ["http", "https"] })
    license: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    authorName: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsEmail()
    authorEmail: string;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    resourceTitle?: string;
}
