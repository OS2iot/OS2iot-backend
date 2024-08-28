import { ApiPropertyOptional } from "@nestjs/swagger";

import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";

export class ListAllPayloadDecoderDto extends ListAllEntitiesDto {
  @ApiPropertyOptional({ description: "Filter to one organization" })
  organizationId?: number;
}
