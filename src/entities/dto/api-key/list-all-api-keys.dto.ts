import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ApiProperty } from "@nestjs/swagger";

export class ListAllApiKeysDto extends ListAllEntitiesDto {
    @ApiProperty({ required: true })
    organisationId: number;
}
