import { GatewayContentsDto } from "@dto/chirpstack/gateway-contents.dto";
import { ApiProperty } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreateGatewayDto {
    @ApiProperty({ required: true })
    @ValidateNested({ each: true })
    @Type(() => GatewayContentsDto)
    gateway: GatewayContentsDto;
}
