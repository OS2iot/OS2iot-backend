import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ListAllPayloadDecoderDto extends ListAllEntitiesDto {
    @ApiPropertyOptional({ description: "Filter to one organization" })
    organizationId?: number;
}
