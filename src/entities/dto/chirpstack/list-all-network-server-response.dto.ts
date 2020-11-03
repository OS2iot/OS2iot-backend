import { NetworkServerDto } from "./network-server.dto";

export class ListAllNetworkServerResponseDto {
    result: NetworkServerDto[];
    totalCount: number;
}
