import { Application } from "@entities/application.entity";
import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-reponse.dto";

export class ListAllApplicationsReponseDto extends ListAllEntitiesResponseDto<
    Application
> {}
