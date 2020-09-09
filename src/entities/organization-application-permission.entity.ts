import { ChildEntity, ManyToMany } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationPermission } from "./organizion-permission.entity";
import { Application } from "@entities/application.entity";
import { Organization } from "@entities/organization.entity";

@ChildEntity(PermissionType.OrganizationApplicationPermissions)
export abstract class OrganizationApplicationPermission extends OrganizationPermission {
    constructor(name: string, org: Organization) {
        super(name, org);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ManyToMany(() => Application, application => application.permissions)
    applications: Application[];
}
