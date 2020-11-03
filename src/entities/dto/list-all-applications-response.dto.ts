import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { Application } from "@entities/application.entity";

export class ListAllApplicationsResponseDto extends ListAllEntitiesResponseDto<
    Application
> {}
