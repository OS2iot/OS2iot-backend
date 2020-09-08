import { DbBaseEntity } from "./base.entity";
import { User } from "@entities/user.entity";
import { ManyToMany, Entity, TableInheritance } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";

@Entity()
@TableInheritance({
    column: { type: "enum", name: "type", enum: PermissionType },
})
export abstract class Permission extends DbBaseEntity {
    @ManyToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => User,
        user => user.permissions
    )
    users: User[];
}
