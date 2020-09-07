import { ApiProperty } from "@nestjs/swagger";
import {
    IsString,
    MinLength,
    MaxLength,
    Min,
    Max,
    IsOptional,
    ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { IoTDeviceType } from "@enum/device-type.enum";
import { CreateLoRaWANSettingsDto } from "./create-lorawan-settings.dto";

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
    commentOnLocation: string;

    @ApiProperty({ required: false })
    @MaxLength(1024)
    @IsOptional()
    @IsString()
    comment: string;

    @ApiProperty({ required: false })
    @IsOptional()
    metadata: JSON;

    @ApiProperty({ required: false })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateLoRaWANSettingsDto)
    lorawanSettings: CreateLoRaWANSettingsDto;
}
