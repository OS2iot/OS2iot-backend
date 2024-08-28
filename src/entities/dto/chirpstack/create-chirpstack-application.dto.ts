import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { ChirpstackApplicationDto } from "./chirpstack-application.dto";
import { ChirpstackDeviceContentsDto } from "./chirpstack-device-contents.dto";

export class CreateChirpstackApplicationDto {
  @ApiProperty({ required: true })
  @ValidateNested({ each: true })
  @Type(() => ChirpstackDeviceContentsDto)
  application: ChirpstackApplicationDto;
}
