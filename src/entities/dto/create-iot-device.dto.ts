import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
    ValidateNested,
} from "class-validator";

import { IoTDeviceType } from "@enum/device-type.enum";

import { CreateLoRaWANSettingsDto } from "./create-lorawan-settings.dto";
import { CreateSigFoxSettingsDto } from "./create-sigfox-settings.dto";
import { IsMetadataJson } from "@helpers/is-metadata-json.validator";
import { nameof } from "@helpers/type-helper";

export class CreateIoTDeviceDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @ApiProperty({ required: true })
    type: IoTDeviceType;

    @Min(1)
    @ApiProperty({
        title: "The id of the application that this IoTDevice should belong to",
        required: true,
    })
    applicationId: number;

    @ApiProperty({ required: false })
    @Max(180.0)
    @Min(-180.0)
    @IsOptional()
    longitude: number;

    @ApiProperty({ required: false })
    @Max(90.0)
    @Min(-90.0)
    @IsOptional()
    latitude: number;

    @ApiProperty({ required: false })
    @MaxLength(1024)
    @IsOptional()
    @IsString()
    commentOnLocation?: string;

    @ApiProperty({ required: false })
    @MaxLength(1024)
    @IsOptional()
    @IsString()
    comment?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsMetadataJson(nameof<CreateIoTDeviceDto>("metadata"))
    metadata?: JSON;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    deviceModelId?: number;

    @ApiProperty({ required: false })
    @ValidateIf(o => o.type == IoTDeviceType.LoRaWAN)
    @ValidateNested({ each: true })
    @Type(() => CreateLoRaWANSettingsDto)
    lorawanSettings?: CreateLoRaWANSettingsDto;

    @ApiProperty({ required: false })
    @ValidateIf(o => o.type == IoTDeviceType.SigFox)
    @ValidateNested({ each: true })
    @Type(() => CreateSigFoxSettingsDto)
    sigfoxSettings?: CreateSigFoxSettingsDto;
}
