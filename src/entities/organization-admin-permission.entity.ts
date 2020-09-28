import { ChildEntity } from "typeorm";

import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { PermissionType } from "@enum/permission-type.enum";

import { OrganizationAdmin } from "../auth/roles.decorator";

@ChildEntity(PermissionType.OrganizationAdmin)
export class OrganizationAdminPermission extends OrganizationPermission {
    constructor(name: string, org: Organization) {
        super(name, org);
        this.type = PermissionType.OrganizationAdmin;
    }
}
