import { ChildEntity } from "typeorm";

import { Permission } from "@entities/permission.entity";
import { PermissionType } from "@enum/permission-type.enum";

@ChildEntity(PermissionType.GlobalAdmin)
export class GlobalAdminPermission extends Permission {
    constructor() {
        super("GlobalAdmin");
        this.type = PermissionType.GlobalAdmin;
    }
}
