import { IoTDevice } from "@entities/iot-device.entity";
import { multicastGroup } from "@enum/multicast-type.enum";
import { ApiProperty } from "@nestjs/swagger";
import {
    IsHexadecimal,
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
    name: string;

    @ApiProperty({ required: true, example: 1 })
    @IsNumber()
    @Min(1)
    applicationID: number;

    @ApiProperty({ required: true })
    @IsHexadecimal()
    @MinLength(8)
    @MaxLength(8)
    mcAddr: string;

    @ApiProperty({ required: true })
    @IsHexadecimal()
    @MaxLength(32)
    @MinLength(32)
    mcNwkSKey: string;

    @ApiProperty({ required: true })
    @IsHexadecimal()
    @MaxLength(32)
    @MinLength(32)
    mcAppSKey: string;

    @ApiProperty({ required: true, example: 300 })
    @IsInt()
    @Min(0)
    fCnt: number;

    @ApiProperty({ required: true, example: 300 })
    @IsInt()
    @Min(0)
    dr: number;

    @ApiProperty({ required: true, example: 300 })
    @IsInt()
    @Min(0)
    frequency: number;

    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(32)
    @MinLength(1)
    groupType: multicastGroup;

    @ApiProperty({ required: true })
    multicastId: string;

    @ApiProperty({ required: false })
    iotDevices: IoTDevice[];
}
