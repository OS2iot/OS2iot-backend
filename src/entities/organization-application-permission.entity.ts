import { ChildEntity, Column, ManyToMany } from "typeorm";

import { Application } from "@entities/application.entity";
import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/organization-permission.entity";
import { PermissionType } from "@enum/permission-type.enum";

@ChildEntity(PermissionType.OrganizationApplicationPermissions)
export abstract class OrganizationApplicationPermission extends OrganizationPermission {
    constructor(name: string, org: Organization, addNewApps?: boolean) {
        super(name, org);
        this.automaticallyAddNewApplications =
            addNewApps != undefined ? addNewApps : false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ManyToMany(() => Application, application => application.permissions)
    applications: Application[];

    @Column({ nullable: true, default: false, type: Boolean })
    automaticallyAddNewApplications = false;
}
