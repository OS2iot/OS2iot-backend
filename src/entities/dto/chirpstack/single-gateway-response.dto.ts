import { DetailedGatewayResponseDto } from "@dto/chirpstack/detailed-gateway-response.dto";
import { GatewayStatsElementDto } from "@dto/chirpstack/gateway-stats.response.dto";

export class SingleGatewayResponseDto {
    gateway: DetailedGatewayResponseDto;

    createdAt?: string;
    updatedAt?: string;
    firstSeenAt?: string;
    lastSeenAt?: string;

    stats: GatewayStatsElementDto[];
}
