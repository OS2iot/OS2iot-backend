import { Application } from "@entities/applikation.entity";
import { ListAllEntitiesResponseDto } from "@dto/list/list-all-entities-reponse.dto";

export class ListAllApplicationsReponseDto extends ListAllEntitiesResponseDto<
    Application
> {}
