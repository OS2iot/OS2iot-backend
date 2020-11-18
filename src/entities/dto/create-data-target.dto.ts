import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { DataTargetType } from "@enum/data-target-type.enum";
import { CreateOpenDataDkDatasetDto } from "./create-open-data-dk-dataset.dto";

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
    url: string;

    @ApiProperty({ required: false, example: 30000 })
    @IsOptional()
    timeout: number;

    @ApiProperty({ required: false, default: "derp", example: null })
    authorizationHeader: string;

    @ApiPropertyOptional({ required: false })
    @ValidateNested({ each: true })
    @Type(() => CreateOpenDataDkDatasetDto)
    openDataDkDataset?: CreateOpenDataDkDatasetDto;
}
