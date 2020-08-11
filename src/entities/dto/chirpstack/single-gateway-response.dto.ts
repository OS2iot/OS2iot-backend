import { DetailedGatewayResponseDto } from "@dto/chirpstack/detailed-gateway-response.dto";

export class SingleGatewayResponseDto {
    gateway: DetailedGatewayResponseDto;

    createdAt?: string;
    updatedAt?: string;
    firstSeenAt?: string;
    lastSeenAt?: string;
}
