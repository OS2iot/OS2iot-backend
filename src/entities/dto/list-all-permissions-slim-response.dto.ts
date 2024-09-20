import { Permission } from "@entities/permissions/permission.entity";
import { ListAllEntitiesResponseDto } from "./list-all-entities-response.dto";

export type PermissionsSlimDto = Pick<Permission, "id" | "name" | "automaticallyAddNewApplications"> & {
  organization: { id: number };
};
export class ListAllPermissionsSlimResponseDto extends ListAllEntitiesResponseDto<PermissionsSlimDto> {}
