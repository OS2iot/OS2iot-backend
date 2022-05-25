import { ApiPropertyOptional } from "@nestjs/swagger";

import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { StringToNumber } from "@helpers/string-to-number-validator";
import { IsSwaggerOptional } from "@helpers/optional-validator";

export class ListAllApplicationsDto extends ListAllEntitiesDto {
    @IsSwaggerOptional({ description: "Filter to one organization" })
    @StringToNumber()
    organizationId?: number;

    @IsSwaggerOptional({ description: "Filter to one permission" })
    @StringToNumber()
    permissionId?: number;
}
