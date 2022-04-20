// The order of these imports matters! The extended class has to stay at the bottom for avoiding class extends failure.
import { ApiKey } from "@entities/api-key.entity";
import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    Unique,
    OneToOne,
} from "typeorm";
import { Organization } from "./organization.entity";
import { Permission } from "@entities/permission.entity";
import { DbBaseEntity } from "@entities/base.entity";

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

    @ManyToMany(_ => Organization, requestedOrganizations => requestedOrganizations.awaitingUsers, {
        nullable: true,
    })
    @JoinTable()
    requestedOrganizations: Organization[];
    
    @OneToOne(type => ApiKey, a => a.systemUser, {
        nullable: true,
        cascade: false,
    })
    apiKeyRef: ApiKey;

    @Column({ default: false })
    isSystemUser: boolean;
}
