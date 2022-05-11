import { ChildEntity } from "typeorm";

import { OrganizationApplicationPermission } from "@entities/permissions/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";
import { PermissionType } from "@enum/permission-type.enum";

@ChildEntity(PermissionType.OrganizationApplicationAdmin)
export class OrganizationApplicationAdminPermission extends OrganizationApplicationPermission {
    constructor(name: string, org: Organization, addNewApps = false) {
        super(name, org, addNewApps);
        this.type = PermissionType.OrganizationApplicationAdmin;
    }
}
