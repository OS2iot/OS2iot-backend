import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-reponse.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";

export class ListAllSigFoxGroupReponseDto extends ListAllEntitiesResponseDto<
    SigFoxGroup
> {}
