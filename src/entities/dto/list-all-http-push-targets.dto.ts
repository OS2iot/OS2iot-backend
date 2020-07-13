import { HttpPush } from "@entities/http-push.entity";

import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-reponse.dto";

export class ListAllApplicationsReponseDto extends ListAllEntitiesResponseDto<
HttpPush
> {}
