import { GatewayStatusInterval } from "@enum/gateway-status-interval.enum";
import { IsSwaggerOptional } from "@helpers/optional-validator";
import { IsEnum } from "class-validator";

export interface StatusTimestamp {
    timestamp: Date;
    wasOnline: boolean;
}

export interface GatewayStatus {
    id: string;
    name: string;
    statusTimestamps: StatusTimestamp[];
}

export class GetGatewayStatusQuery {
    @IsSwaggerOptional({
        default: GatewayStatusInterval.DAY,
        enum: GatewayStatusInterval,
    })
    @IsEnum(GatewayStatusInterval)
    timeInterval: GatewayStatusInterval = GatewayStatusInterval.DAY;
}
