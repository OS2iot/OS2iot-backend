import { GatewayResponseChirpstackDto, GatewayResponseDto } from "./gateway-response.dto";

export class ListAllGatewaysResponseDto {
    totalCount: number;
    resultList: GatewayResponseDto[];
}

export class ListAllGatewaysResponseChirpstackDto {
    totalCount: number;
    resultList: GatewayResponseChirpstackDto[];
}
