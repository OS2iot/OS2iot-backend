import { Permission } from "./permission.entity";
import { ChildEntity } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";

@ChildEntity(PermissionType.GlobalAdmin)
export class GlobalAdminPermission extends Permission {}
