import { GatewayStatsElementDto } from "@dto/chirpstack/gateway-stats.response.dto";
import { GatewayResponseGrpcDto } from "@dto/chirpstack/gateway-response.dto";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

export class SingleGatewayResponseDto {
    gateway: GatewayResponseGrpcDto;
    stats?: GatewayStatsElementDto[];
}
