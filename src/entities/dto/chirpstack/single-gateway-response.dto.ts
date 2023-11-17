import { DetailedGatewayResponseDto } from "@dto/chirpstack/detailed-gateway-response.dto";
import { GatewayStatsElementDto } from "@dto/chirpstack/gateway-stats.response.dto";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

export class SingleGatewayResponseDto {
    gateway?: DetailedGatewayResponseDto;
    createdAt?: Date;
    updatedAt?: Date;
    lastSeenAt?: Timestamp.AsObject;
    stats?: GatewayStatsElementDto[];
}
