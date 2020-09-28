import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { DeviceProfileDto } from "./device-profile.dto";

export class CreateDeviceProfileDto {
    @ApiProperty({ required: true })
    @ValidateNested({ each: true })
    @Type(() => DeviceProfileDto)
    deviceProfile: DeviceProfileDto;
}
