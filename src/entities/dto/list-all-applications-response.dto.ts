import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-reponse.dto";
import { Application } from "@entities/application.entity";

export class ListAllApplicationsReponseDto extends ListAllEntitiesResponseDto<
    Application
> {}
