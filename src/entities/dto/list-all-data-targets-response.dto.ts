import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { DataTarget } from "@entities/data-target.entity";

export type DataTargetDto = DataTarget & {
  hasRecentErrors?: boolean;
};

export class ListAllDataTargetsResponseDto extends ListAllEntitiesResponseDto<DataTargetDto> {}
