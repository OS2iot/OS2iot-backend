import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ListAllEntitiesDto } from "./list-all-entities.dto";

export class ListAllPermissionsDto extends ListAllEntitiesDto {
    @ApiProperty({ type: String, required: false })
    organisationId?: number;

    @ApiProperty({ type: String, required: false })
    userId?: string;
}
