import { DbBaseEntity } from "@entities/base.entity";
import { User } from "@entities/user.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { Column, Entity, ManyToMany, TableInheritance } from "typeorm";

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
