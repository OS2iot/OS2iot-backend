import { ApiProperty } from "@nestjs/swagger";
import { ListAllEntitiesDto } from "./list-all-entities.dto";

export class ListAllDeviceModelsDto extends ListAllEntitiesDto {
  @ApiProperty({ required: false, type: Number })
  organizationId?: number;
}
