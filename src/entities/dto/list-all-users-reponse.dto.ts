import { ListAllEntitiesResponseDto } from "./list-all-entities-reponse.dto";
import { UserResponseDto } from "./user-response.dto";

export class ListAllUsersReponseDto extends ListAllEntitiesResponseDto<
    UserResponseDto
> {}
