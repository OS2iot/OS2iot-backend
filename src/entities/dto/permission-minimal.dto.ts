import { PermissionType } from "@enum/permission-type.enum";

export class PermissionMinimalDto {
  permission_type_type: PermissionType;
  organization_id: number;
  application_id: number;
}
