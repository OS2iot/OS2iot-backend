import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { ChirpstackDeviceContentsDto } from "@dto/chirpstack/chirpstack-device-contents.dto";

export class CreateChirpstackDeviceDto {
    @ApiProperty({ required: true })
    @ValidateNested({ each: true })
    @Type(() => ChirpstackDeviceContentsDto)
    device: ChirpstackDeviceContentsDto;
}
