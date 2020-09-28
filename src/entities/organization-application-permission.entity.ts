import { ChildEntity, ManyToMany } from "typeorm";

import { Application } from "@entities/application.entity";
import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { PermissionType } from "@enum/permission-type.enum";

@ChildEntity(PermissionType.OrganizationApplicationPermissions)
export abstract class OrganizationApplicationPermission extends OrganizationPermission {
    constructor(name: string, org: Organization) {
        super(name, org);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ManyToMany(() => Application, application => application.permissions)
    applications: Application[];
}
