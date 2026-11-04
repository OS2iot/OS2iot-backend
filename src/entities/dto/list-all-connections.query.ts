import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ApiProperty } from "@nestjs/swagger";

export class ListAllConnectionsQuery extends ListAllEntitiesDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: "Limit the results to the connections from a single application",
  })
  applicationId?: number;
}
