import { ChirpstackGatewayResponseDto, GatewayResponseDto } from "./gateway-response.dto";

export class ListAllGatewaysResponseDto {
  totalCount: number;
  resultList: GatewayResponseDto[];
}

export class ListAllChirpstackGatewaysResponseDto {
  totalCount: number;
  resultList: ChirpstackGatewayResponseDto[];
}
