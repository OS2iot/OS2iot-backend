import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import {
    PrimaryColumn,
} from "typeorm";

@Entity("endpoint")
export class Endpoint {

    @PrimaryColumn()
    apiKey: string;

    @Column()
    targetType: string;

    @Column("simple-array")
    endpointUrl: string;

    toString(): string {
        return `endpointUrl: ${this.endpointUrl} - type:${this.targetType} apikey: ${this.apiKey}`;
    }
}
