import { ApiProperty } from "@nestjs/swagger";
import { NetworkServerDto } from "./network-server.dto";

export class CreateNetworkServerDto {
    networkServer: NetworkServerDto;
}
