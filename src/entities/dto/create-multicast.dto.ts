import { ApiProperty } from "@nestjs/swagger";
import {
    IsInt,
    IsNumber,
    IsString,
    MaxLength,
    Min,
    MinLength,
} from "class-validator";

export class CreateMulticastDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    groupName: string;

    @ApiProperty({ required: true, example: 1 })
    @IsNumber()
    @Min(1)
    applicationId: number;

    @ApiProperty({ required: true })
    @IsString()
    @MinLength(8)
    @MaxLength(8)
    address: string;

    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(32)
    @MinLength(32)
    networkSessionKey: string;

    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(32)
    @MinLength(32)
    applicationSessionKey: string;

    @ApiProperty({ required: true, example: 300 })
    @IsInt()
    @Min(0)
    frameCounter: number;

    @ApiProperty({ required: true, example: 300 })
    @IsInt()
    @Min(0)
    dataRate: number;

    @ApiProperty({ required: true, example: 300 })
    @IsInt()
    @Min(0)
    frequency: number;

    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(32)
    @MinLength(1)
    groupType: string;
}
