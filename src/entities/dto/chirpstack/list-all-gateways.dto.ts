import { GatewayResponseDto } from "@dto/chirpstack/gateway-response.dto";

export class ListAllGatewaysResponseDto {
    totalCount: number;
    result: GatewayResponseDto[];
}
