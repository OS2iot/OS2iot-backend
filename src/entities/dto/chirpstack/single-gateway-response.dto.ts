import { GatewayStatsElementDto } from "@dto/chirpstack/gateway-stats.response.dto";
import { GatewayResponseDto } from "@dto/chirpstack/gateway-response.dto";

export class SingleGatewayResponseDto {
  gateway: GatewayResponseDto;
  stats?: GatewayStatsElementDto[];
}
