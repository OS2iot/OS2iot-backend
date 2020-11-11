import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { GatewayContentsDto } from "@dto/chirpstack/gateway-contents.dto";

export class CreateGatewayDto {
    @ApiProperty({ required: true })
    @ValidateNested({ each: true })
    @Type(() => GatewayContentsDto)
    gateway: GatewayContentsDto;

    @ApiProperty({ required: true })
    organizationId: number;
}
