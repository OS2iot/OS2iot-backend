import { GatewayResponseDto } from "@dto/chirpstack/gateway-reponse.dto";

export class DetailedGatewayResponseDto extends GatewayResponseDto {
    discoveryEnabled: boolean;
    gatewayProfileID: string;
    boards: any[];
    tags: JSON;
    metadata: JSON;
}
