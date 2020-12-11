import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { DataTargetType } from "@enum/data-target-type.enum";
import { CreateOpenDataDkDatasetDto } from "@dto/create-open-data-dk-dataset.dto";
import { IsNotBlank } from "@helpers/is-not-blank.validator";

export class CreateDataTargetDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @ApiProperty({ required: true, example: 1 })
    @IsNumber()
    @Min(1)
    applicationId: number;

    @ApiProperty({ required: true })
    type: DataTargetType;

    @ApiProperty({ required: true, example: "https://example.com/endpoint" })
    @IsString()
    @MaxLength(1024)
    @IsNotBlank("url")
    @IsUrl()
    url: string;

    @ApiProperty({ required: true, example: 30000 })
    @IsInt()
    timeout: number;

    @ApiProperty({ required: false, default: "", example: null })
    authorizationHeader: string;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateOpenDataDkDatasetDto)
    openDataDkDataset?: CreateOpenDataDkDatasetDto;
}
