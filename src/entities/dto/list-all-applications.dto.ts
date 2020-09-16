import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ListAllApplicationsDto extends ListAllEntitiesDto {
    @ApiPropertyOptional({ description: "Filter to one organization" })
    organizationId?: number;
}
