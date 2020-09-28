import { Permission } from "@entities/permission.entity";

import { ListAllEntitiesResponseDto } from "./list-all-entities-reponse.dto";

export class ListAllPermissionsReponseDto extends ListAllEntitiesResponseDto<
    Permission
> {}
