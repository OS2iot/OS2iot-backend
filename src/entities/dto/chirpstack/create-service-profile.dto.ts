import { ApiProperty } from "@nestjs/swagger";
import { ServiceProfileDto } from "./service-profile.dto";

export class CreateServiceProfileDto {
    @ApiProperty({ required: true })
    serviceProfile: ServiceProfileDto;
}
