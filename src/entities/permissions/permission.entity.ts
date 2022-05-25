import { DbBaseEntity } from "@entities/base.entity";
import { User } from "@entities/user.entity";
import { PermissionType } from "@enum/permission-type.enum";
import {
    Column,
    Entity,
    ManyToMany,
    TableInheritance,
    OneToMany,
    ManyToOne,
    RelationId,
} from "typeorm";
import { PermissionTypeEntity } from "./permission-type.entity";
import { Application } from "@entities/application.entity";
import { Organization } from "@entities/organization.entity";
import { ApiKey } from "@entities/api-key.entity";
import { nameof } from "@helpers/type-helper";

@Entity("permission")
export class Permission extends DbBaseEntity {
    constructor(name: string, org?: Organization, addNewApps = false) {
        super();
        this.name = name;
        this.organization = org;
        this.automaticallyAddNewApplications = addNewApps;
    }

    @OneToMany(() => PermissionTypeEntity, entity => entity.permission, {
        nullable: false,
        cascade: true,
    })
    type: PermissionTypeEntity[];

    @Column()
    name: string;

    @ManyToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        () => User,
        user => user.permissions
    )
    users: User[];

    @ManyToMany(() => Application, application => application.permissions)
    applications: Application[];

    // ORM-specific column for extracting the id of the application
    @RelationId(nameof<Permission>("applications"))
    applicationIds: Application["id"][];

    @Column({ nullable: true, default: false, type: Boolean })
    automaticallyAddNewApplications = false;

    @ManyToOne(() => Organization, { onDelete: "CASCADE" })
    organization: Organization;

    @ManyToMany(_ => ApiKey, key => key.permissions, { onDelete: "CASCADE" })
    apiKeys: ApiKey[];
}
