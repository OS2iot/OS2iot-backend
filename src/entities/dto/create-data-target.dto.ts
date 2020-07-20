import { ApiProperty } from "@nestjs/swagger";
import { DataTargetType } from "@enum/data-target-type.enum";
import {
    IsString,
    MinLength,
    MaxLength,
    IsNumber,
    Min,
    IsOptional,
} from "class-validator";

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

    @ApiProperty({ required: false, example: "https://example.com/endpoint" })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    url: string;

    @ApiProperty({ required: false, example: 30000 })
    @IsOptional()
    timeout: number;

    @ApiProperty({ required: false, default: "derp", example: null })
    authorizationHeader: string;
}
