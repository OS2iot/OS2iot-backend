import { Entity, Column, ManyToMany, JoinTable, Unique } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { Permission } from "./permission.entity";

@Entity("user")
@Unique(["email"])
export class User extends DbBaseEntity {
    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    passwordHash: string;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ManyToMany(type => Permission, permission => permission.users)
    @JoinTable()
    permissions: Permission[];
}
