import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";

@Entity("recieveData")
export class RecieveData extends DbBaseEntity {
    @Column({ type: "json" })
    data: JSON;

    toString(): string {
        return `IoTDevices: id: ${this.id} - name: ${this.data}`;
    }
}
