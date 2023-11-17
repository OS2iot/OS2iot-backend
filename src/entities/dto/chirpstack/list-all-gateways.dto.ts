import { GatewayResponseGrpcDto } from "@dto/chirpstack/gateway-response.dto";

export class ListAllGatewaysResponseGrpcDto {
    totalCount: number;
    resultList: GatewayResponseGrpcDto[];
}
