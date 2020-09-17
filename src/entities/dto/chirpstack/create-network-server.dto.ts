import { NetworkServerDto } from "./network-server.dto";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateNetworkServerDto {
    @ApiProperty({ required: true })
    @ValidateNested({ each: true })
    @Type(() => NetworkServerDto)
    networkServer: NetworkServerDto;
}
