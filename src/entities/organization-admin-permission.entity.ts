import { ChildEntity } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationPermission } from "./organizion-permission.entity";
import { Organization } from "@entities/organization.entity";

@ChildEntity(PermissionType.OrganizationAdmin)
export class OrganizationAdminPermission extends OrganizationPermission {
    constructor(name: string, org: Organization) {
        super(name, org);
    }
}
