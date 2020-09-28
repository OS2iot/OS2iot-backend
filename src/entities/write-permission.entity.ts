import { ChildEntity } from "typeorm";

import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";
import { PermissionType } from "@enum/permission-type.enum";

@ChildEntity(PermissionType.Write)
export class WritePermission extends OrganizationApplicationPermission {
    constructor(name: string, org: Organization) {
        super(name, org);
        this.type = PermissionType.Write;
    }
}
