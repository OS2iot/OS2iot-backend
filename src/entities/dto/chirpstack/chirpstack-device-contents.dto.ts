import {
    IsUUID,
    IsString,
    IsOptional,
    MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChirpstackDeviceContentsDto {
    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(50)
    name: string;

    @ApiProperty({ required: true })
    @IsString()
    description: string;

    @ApiProperty({ required: true })
    @IsString()
    applicationID: string;

    @ApiProperty({ required: true })
    @IsString()
    devEUI: string;

    @ApiProperty({ required: true })
    @IsOptional()
    @IsUUID()
    deviceProfileID: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    isDisabled: boolean;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    skipFCntCheck: boolean;

    @ApiProperty({ required: false, default: {} })
    variables: JSON;

    @ApiProperty({ required: false, default: {} })
    tags: JSON;
}
