import { NetworkServerDto } from "./network-server.dto";

export class ListAllNetworkServerReponseDto {
    result: NetworkServerDto[];
    totalCount: number;
}
