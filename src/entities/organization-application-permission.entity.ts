import { ChildEntity, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationPermission } from "./organizion-permission.entity";
import { Application } from "@entities/application.entity";

@ChildEntity(PermissionType.OrganizationApplicationPermissions)
export abstract class OrganizationApplicationPermission extends OrganizationPermission {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ManyToMany(type => Application, application => application.permissions)
    applications: Application[];
}
