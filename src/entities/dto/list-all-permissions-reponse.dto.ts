import { ListAllEntitiesResponseDto } from "./list-all-entities-reponse.dto";
import { Permission } from "@entities/permission.entity";

export class ListAllPermissionsReponseDto extends ListAllEntitiesResponseDto<
    Permission
> {}
