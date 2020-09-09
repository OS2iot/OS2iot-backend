import { ChildEntity } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationApplicationPermission } from "./organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";

@ChildEntity(PermissionType.Write)
export class WritePermission extends OrganizationApplicationPermission {
    constructor(name: string, org: Organization) {
        super(name, org);
    }
}
