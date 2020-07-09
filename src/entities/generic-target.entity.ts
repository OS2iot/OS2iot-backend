import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import {
    PrimaryColumn,
} from "typeorm";

@Entity("genericTarget")
export class GenericTarget {

    @PrimaryColumn()
    targetName: string;

    @Column("simple-array")
    applicationId: string;

    @Column("simple-array")
    devices: string;

    toString(): string {
        return `targetName: ${this.targetName} - applicationId:${this.applicationId} devices: ${this.devices}`;
    }
}
