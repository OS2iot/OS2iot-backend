import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { NetworkServerDto } from "./network-server.dto";

export class CreateNetworkServerDto {
    @ApiProperty({ required: true })
    @ValidateNested({ each: true })
    @Type(() => NetworkServerDto)
    networkServer: NetworkServerDto;
}
