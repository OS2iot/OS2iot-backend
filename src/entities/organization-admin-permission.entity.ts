import { ChildEntity } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationPermission } from "./organizion-permission.entity";

@ChildEntity(PermissionType.OrganizationAdmin)
export class OrganizationAdminPermission extends OrganizationPermission {}
