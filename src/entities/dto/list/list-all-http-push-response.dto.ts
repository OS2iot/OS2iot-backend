import { ListAllEntitiesResponseDto } from "@dto/list/list-all-entities-reponse.dto";
import { HttpPush } from "@entities/http-push.entity";

export class ListAllHttpPushResponseDto extends ListAllEntitiesResponseDto<
    HttpPush
> {}
