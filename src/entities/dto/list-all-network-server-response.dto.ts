import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-reponse.dto";
import { NetworkServer } from "@entities/network-server.entity";
import { DbBaseEntity } from "@entities/base.entity";
import { ApiProperty } from "@nestjs/swagger";

export class ListAllNetworkServerReponseDto extends ListAllEntitiesResponseDto<
    NetworkServer
> {
    result: [];
    totalCount: number;
}
