import { ValidateNested } from "class-validator";
import { ServiceProfileDto } from "./service-profile.dto";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateServiceProfileDto {
    @ApiProperty({ required: true })
    @ValidateNested({ each: true })
    @Type(() => ServiceProfileDto)
    serviceProfile: ServiceProfileDto;
}
