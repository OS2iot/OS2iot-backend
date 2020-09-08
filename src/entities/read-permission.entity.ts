import { ChildEntity } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationApplicationPermission } from "./organization-application-permission.entity";

@ChildEntity(PermissionType.Read)
export class ReadPermission extends OrganizationApplicationPermission {}
