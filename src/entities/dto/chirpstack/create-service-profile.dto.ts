import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { ServiceProfileDto } from "./service-profile.dto";

export class CreateServiceProfileDto {
    @ApiProperty({ required: true })
    @ValidateNested({ each: true })
    @Type(() => ServiceProfileDto)
    serviceProfile: ServiceProfileDto;
}
