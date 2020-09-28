import { DbBaseEntity } from "@entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Organization } from "@entities/organization.entity";

@Entity("payload_decoder")
export class PayloadDecoder extends DbBaseEntity {
    @Column()
    name: string;

    @Column({ type: "text" })
    decodingFunction: string;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Organization,
        organization => organization.payloadDecoders,
        { onDelete: "CASCADE", nullable: true }
    )
    organization?: Organization;
}
