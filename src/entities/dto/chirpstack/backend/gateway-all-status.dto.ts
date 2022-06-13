import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { GatewayStatusInterval } from "@enum/gateway-status-interval.enum";
import { IsSwaggerOptional } from "@helpers/optional-validator";
import { StringToNumber } from "@helpers/string-to-number-validator";
import { IsEnum } from "class-validator";
import { GatewayStatus } from "./gateway-status.dto";

export class GatewayGetAllStatusResponseDto extends ListAllEntitiesResponseDto<GatewayStatus> {}

export class ListAllGatewayStatusDto extends ListAllEntitiesDto {
    @IsSwaggerOptional()
    @StringToNumber()
    organizationId?: number;

    @IsSwaggerOptional({
        default: GatewayStatusInterval.DAY,
        enum: GatewayStatusInterval,
    })
    @IsEnum(GatewayStatusInterval)
    timeInterval: GatewayStatusInterval = GatewayStatusInterval.DAY;
}
