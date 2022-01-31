import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    Unique,
} from "typeorm";

import { DbBaseEntity } from "@entities/base.entity";
import { Permission } from "@entities/permission.entity";
import { Organization } from "./organization.entity";

@Entity("user")
@Unique(["email"])
export class User extends DbBaseEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ select: false, nullable: true })
    passwordHash: string;

    @Column({ default: true })
    active: boolean;

    @Column({ nullable: true })
    lastLogin?: Date;

    @Column({ nullable: true })
    nameId: string;

    @Column({ nullable: true })
    awaitingConfirmation: boolean;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ManyToMany(type => Permission, permission => permission.users)
    @JoinTable()
    permissions: Permission[];

    @ManyToMany(_ => Organization, requestedOrganizations => requestedOrganizations.users, {
        nullable: true,
    })
    @JoinTable()
    requestedOrganizations: Organization[];
}
