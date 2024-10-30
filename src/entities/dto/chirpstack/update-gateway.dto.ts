import { ApiHideProperty, ApiProperty, OmitType } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";
import { GatewayContentsDto } from "./gateway-contents.dto";
import { Transform, Type } from "class-transformer";

export class UpdateGatewayContentsDto extends OmitType(GatewayContentsDto, ["gatewayId"]) {
  @ApiHideProperty()
  @Transform(({ value }) => value.toLowerCase())
  gatewayId: string;

  @ApiHideProperty()
  createdBy?: number;

  @ApiHideProperty()
  updatedBy?: number;
}

export class UpdateGatewayDto {
  @ApiProperty({ required: true })
  @ValidateNested({ each: true })
  @Type(() => UpdateGatewayContentsDto)
  gateway: UpdateGatewayContentsDto;
}

export class UpdateGatewayOrganizationDto {
  public organizationId: number;
}
