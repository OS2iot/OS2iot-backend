import { ApiProperty } from "@nestjs/swagger";

export class ListAllEntitiesResponseDto<T> {
    @ApiProperty()
    data: T[];
    @ApiProperty()
    count: number;
}
