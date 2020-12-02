import { ApiPropertyOptional } from "@nestjs/swagger";

import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";

export class ListAllApplicationsDto extends ListAllEntitiesDto {
    @ApiPropertyOptional({ description: "Filter to one organization" })
    organizationId?: number;

    @ApiPropertyOptional({ description: "Filter to one permission" })
    permissionId?: number;
}
