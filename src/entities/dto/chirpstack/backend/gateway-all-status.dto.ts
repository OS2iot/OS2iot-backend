import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { StringToNumber } from "@helpers/string-to-number-validator";
import { ApiProperty } from "@nestjs/swagger";
import { GatewayStatus } from "./gateway-status.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";

export class GatewayGetAllStatusResponseDto extends ListAllEntitiesResponseDto<GatewayStatus> {}

export class ListAllGatewayStatusDto extends ListAllEntitiesDto {
    @ApiProperty({ type: Number, required: true })
    @StringToNumber()
    organizationId?: number;
}
