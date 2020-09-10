import { DbBaseEntity } from "./base.entity";
import { User } from "@entities/user.entity";
import { ManyToMany, Entity, TableInheritance, Column } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";
import { PermissionModule } from "../permission/permission.module";

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
        type => User,
        user => user.permissions
    )
    users: User[];
}
