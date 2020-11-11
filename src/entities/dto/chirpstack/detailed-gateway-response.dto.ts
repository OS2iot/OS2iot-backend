import { GatewayResponseDto } from "@dto/chirpstack/gateway-response.dto";

export class DetailedGatewayResponseDto extends GatewayResponseDto {
    discoveryEnabled: boolean;
    gatewayProfileID: string;
    boards: any[];
    tags: { [id: string]: string };
    tagsString: string;
    metadata: JSON;
}
