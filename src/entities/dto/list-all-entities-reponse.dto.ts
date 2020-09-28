import { ApiProperty } from "@nestjs/swagger";

import { DbBaseEntity } from "@entities/base.entity";

export class ListAllEntitiesResponseDto<T extends DbBaseEntity> {
    @ApiProperty()
    data: T[];
    @ApiProperty()
    count: number;
}
