import { DbBaseEntity } from "@entities/base.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { Column, Entity, ManyToOne } from "typeorm";
import { Permission } from "./permission.entity";

@Entity("permission_type")
// TODO: Temp name to avoid clashing with enum value
export class PermissionTypeEntity extends DbBaseEntity {
    @Column()
    type: PermissionType;

    @ManyToOne(() => Permission, p => p.type, {
        onDelete: "CASCADE",
        // Delete the row instead of null'ing application. Useful for updates
        orphanedRowAction: "delete",
    })
    permission: Permission;
}
