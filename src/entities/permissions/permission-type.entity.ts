import { DbBaseEntity } from "@entities/base.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { Column, Entity, ManyToOne, Unique } from "typeorm";
import { Permission } from "./permission.entity";
import { nameof } from "@helpers/type-helper";

@Entity("permission_type")
@Unique([nameof<PermissionTypeEntity>("type"), nameof<PermissionTypeEntity>("permission")])
export class PermissionTypeEntity extends DbBaseEntity {
    @Column("enum", {
        enum: PermissionType,
    })
    type: PermissionType;

    @ManyToOne(() => Permission, p => p.type, {
        onDelete: "CASCADE",
        // Delete the row instead of null'ing application. Useful for updates
        orphanedRowAction: "delete",
    })
    permission: Permission;
}
