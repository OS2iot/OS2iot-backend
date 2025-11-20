import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateOpenDataDkDatasetDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString({ each: true, always: true })
  keywords?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keywordTags: string;

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

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  resourceTitle: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  updateFrequency: string = "UNKNOWN";

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  documentationUrl: string;

  @ApiProperty({ required: true })
  @IsBoolean()
  dataDirectory: boolean;
}
