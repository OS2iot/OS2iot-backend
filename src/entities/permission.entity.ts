//All Permissions is included in one file since circular references and typescript makes the program crash unregularaly.
//It happens because circular references can happen between files and not only types.

import { User } from "@entities/user.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { ChildEntity, Column, Entity, ManyToMany, ManyToOne, TableInheritance } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { Organization } from "./organization.entity";
import { ApiKey } from "./api-key.entity";
import { Application } from "./application.entity";

@Entity()
@TableInheritance({
    column: { type: "enum", name: "type", enum: PermissionType },
})
export abstract class Permission extends DbBaseEntity {
    constructor(name: string) {
        super();
        this.name = name;
    }

    @Column("enum", {
        enum: PermissionType,
    })
    type: PermissionType;

    @Column()
    name: string;

    @ManyToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        () => User,
        user => user.permissions
    )
    users: User[];
}

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

@ChildEntity(PermissionType.GlobalAdmin)
export class GlobalAdminPermission extends Permission {
    constructor() {
        super("GlobalAdmin");
        this.type = PermissionType.GlobalAdmin;
    }
}

@ChildEntity(PermissionType.ApiKeyPermission)
export abstract class ApiKeyPermission extends Permission {
    @ManyToMany(_ => ApiKey, key => key.permissions, { onDelete: "CASCADE" })
    apiKeys: ApiKey[];

}

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

@ChildEntity(PermissionType.OrganizationAdmin)
export class OrganizationAdminPermission extends OrganizationPermission {
    constructor(name: string, org: Organization) {
        super(name, org);
        this.type = PermissionType.OrganizationAdmin;
    }
}

@ChildEntity(PermissionType.Write)
export class WritePermission extends OrganizationApplicationPermission {
    constructor(name: string, org: Organization, addNewApps = false) {
        super(name, org, addNewApps);
        this.type = PermissionType.Write;
    }
}

@ChildEntity(PermissionType.Read)
export class ReadPermission extends OrganizationApplicationPermission {
    constructor(name: string, org: Organization, addNewApps = false) {
        super(name, org, addNewApps);
        this.type = PermissionType.Read;
    }
}

