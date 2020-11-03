import { Permission } from "@entities/permission.entity";

import { ListAllEntitiesResponseDto } from "./list-all-entities-response.dto";

export class ListAllPermissionsResponseDto extends ListAllEntitiesResponseDto<
    Permission
> {}
