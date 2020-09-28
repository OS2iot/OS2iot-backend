import { Column, Entity, OneToMany, Unique } from "typeorm";

import { Application } from "@entities/application.entity";
import { DbBaseEntity } from "@entities/base.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { Permission } from "@entities/permission.entity";

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

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => PayloadDecoder,
        payloadDecoder => payloadDecoder.organization,
        { onDelete: "CASCADE", nullable: true }
    )
    payloadDecoders?: PayloadDecoder[];
}
