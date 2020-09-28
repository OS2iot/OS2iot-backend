import { Column, Entity, ManyToOne } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { Organization } from "@entities/organization.entity";

@Entity()
export class SigFoxGroup extends DbBaseEntity {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ManyToOne(type => Organization, organization => organization.sigfoxGroups, {
        onDelete: "CASCADE",
    })
    belongsTo: Organization;

    @Column({ nullable: false })
    username: string;

    @Column({ nullable: false })
    password: string;
}
