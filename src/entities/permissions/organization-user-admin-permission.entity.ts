import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/permissions/organization-permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { ChildEntity } from "typeorm";

@ChildEntity(PermissionType.OrganizationUserAdmin)
export class OrganizationUserAdminPermission extends OrganizationPermission {
    constructor(name: string, org: Organization) {
        super(name, org);
    }
}
