import { ChildEntity, ManyToOne } from "typeorm";

import { Organization } from "@entities/organization.entity";
import { Permission } from "@entities/permission.entity";
import { PermissionType } from "@enum/permission-type.enum";

@ChildEntity(PermissionType.OrganizationPermission)
export abstract class OrganizationPermission extends Permission {
    constructor(name: string, org: Organization) {
        super(name);
        this.organization = org;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ManyToOne(() => Organization, { onDelete: "CASCADE" })
    organization: Organization;
}
