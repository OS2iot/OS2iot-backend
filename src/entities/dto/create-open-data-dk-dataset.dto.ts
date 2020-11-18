import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString, IsUrl, Length } from "class-validator";

export class CreateOpenDataDkDatasetDto {
    @ApiProperty({ required: true })
    @IsString()
    @Length(1, 100)
    name: string;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @IsString()
    @Length(1, 1024)
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
    @Length(5, 100)
    authorName: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsEmail()
    authorEmail: string;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @IsString()
    @Length(5, 100)
    resourceTitle?: string;
}
