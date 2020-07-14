import { Entity, Column, OneToOne } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { DataTarget } from "@entities/data-target.entity";

import {
    PrimaryColumn,
} from "typeorm";

@Entity("httpPush")
export class HttpPush  extends DbBaseEntity {

    @Column()
    targetUrl: string;

    @Column()
    timeout: number;

    @Column()
    authorizationHeader : string;

 /*
    @Column()
    dataTargetId: number;
*/
    @OneToOne(
        type => DataTarget,
        dataTarget => dataTarget.httpPush,
    )
    dataTarget: DataTarget[];

    toString(): string {
        return `targetUrl: ${this.targetUrl} - timeout:${this.timeout} authorizationHeader: ${this.authorizationHeader}`;
    }
}
