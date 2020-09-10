import { Entity, Column, OneToMany, Unique } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { Application } from "@entities/application.entity";
import { Permission } from "./permission.entity";
import { OrganizationPermission } from "./organizion-permission.entity";

@Entity("organization")
@Unique(["name"])
export class Organization extends DbBaseEntity {
    @Column({ unique: true })
    name: string;

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Application,
        application => application.belongsTo,
        { onDelete: "CASCADE" }
    )
    applications: Application[];

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => OrganizationPermission,
        permission => permission.organization,
        { onDelete: "CASCADE" }
    )
    permissions: Permission[];
}
