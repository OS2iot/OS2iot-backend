import { ListAllEntitiesResponseDto } from "@dto/list/list-all-entities-reponse.dto";
import { HttpPushTarget } from "@entities/http-push-target.entity";

export class ListAllHttpPushTargetResponseDto extends ListAllEntitiesResponseDto<
    HttpPushTarget
> {}
