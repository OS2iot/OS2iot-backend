import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";

@Entity("recieve-data")
export class RecieveData extends DbBaseEntity {
    @Column()
    data: string;

    toString(): string {
        return `RecieveData: id: ${this.id} - data: ${this.data}`;
    }
}
