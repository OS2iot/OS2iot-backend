import { ChildEntity } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";

@ChildEntity(PermissionType.Read)
export class ReadPermission extends OrganizationApplicationPermission {
    constructor(name: string, org: Organization) {
        super(name, org);
        this.type = PermissionType.Read;
    }
}
