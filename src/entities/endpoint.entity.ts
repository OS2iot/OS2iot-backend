import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import {
    PrimaryColumn,
} from "typeorm";

@Entity("endpoint")
export class Endpoint {
    @Column("simple-array")
    endpointUrl: string[];

    @PrimaryColumn()
    apiKey: string;

    toString(): string {
        return `endpointUrl: ${this.endpointUrl} - apikey: ${this.apiKey}`;
    }
}
