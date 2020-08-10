import { ApiProperty } from "@nestjs/swagger";
import { NetworkServerDto } from "./network-server.dto";

export class CreateNetworkServerDto {
    @ApiProperty({ required: true })
    networkServer: NetworkServerDto;
}
