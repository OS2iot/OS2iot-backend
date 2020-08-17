import { DbBaseEntity } from "@entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity("payload_decoder")
export class PayloadDecoder extends DbBaseEntity {
    @Column()
    name: string;

    @Column({ type: "text" })
    decodingFunction: string;
}
