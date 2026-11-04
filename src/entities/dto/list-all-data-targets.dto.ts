import { ApiProperty } from "@nestjs/swagger";

import { ListAllEntitiesDto } from "./list-all-entities.dto";

export class ListAllDataTargetsDto extends ListAllEntitiesDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: "Limit the results to the data-targets associated with a single organization",
  })
  organizationId: number;
}
