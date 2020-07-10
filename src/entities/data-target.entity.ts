import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import {
    PrimaryColumn,
} from "typeorm";

@Entity("dataTarget")
export class DataTarget  {

    @PrimaryColumn()
    targetName: string;

    @Column("simple-array")
    applicationId: number;

    @Column("simple-array")
    devices: string;

    toString(): string {
        return `targetName: ${this.targetName} - applicationId:${this.applicationId} devices: ${this.devices}`;
    }
}
