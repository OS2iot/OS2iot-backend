import { Entity, Column, OneToOne } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { DataTarget } from "@entities/data-target.entity";

import {
    PrimaryColumn,
} from "typeorm";

@Entity("httpPushTarget")
export class HttpPushTarget  extends DbBaseEntity {

    @Column()
    targetUrl: string;

    @Column()
    timeout: number;

    @Column()
    authorizationHeader : string;

    toString(): string {
        return `targetUrl: ${this.targetUrl} - timeout:${this.timeout} authorizationHeader: ${this.authorizationHeader}`;
    }
}
