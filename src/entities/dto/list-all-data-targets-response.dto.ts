import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { DataTarget } from "@entities/data-target.entity";

export class ListAllDataTargetsResponseDto extends ListAllEntitiesResponseDto<
    DataTarget
> {}
