import { ApiHideProperty, ApiProperty, OmitType } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";
import { GatewayContentsDto } from "./gateway-contents.dto";
import { Type } from "class-transformer";

export class UpdateGatewayContentsDto extends OmitType(GatewayContentsDto, ["id"]) {
    @ApiHideProperty()
    id: string;
}

export class UpdateGatewayDto {
    @ApiProperty({ required: true })
    @ValidateNested({ each: true })
    @Type(() => UpdateGatewayContentsDto)
    gateway: UpdateGatewayContentsDto;
}
