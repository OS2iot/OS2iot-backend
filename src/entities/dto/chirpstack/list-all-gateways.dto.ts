import { GatewayResponseDto } from "@dto/chirpstack/gateway-reponse.dto";

export class ListAllGatewaysReponseDto {
    totalCount: number;
    result: GatewayResponseDto[];
}
