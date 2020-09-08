import { Entity, Column, OneToMany } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { Application } from "@entities/application.entity";

@Entity("organization")
export class Organization extends DbBaseEntity {
    @Column()
    name: string;

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Application,
        application => application.belongsTo,
        { onDelete: "CASCADE" }
    )
    applications: Application[];
}
