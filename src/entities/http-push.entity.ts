import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import {
    PrimaryColumn,
} from "typeorm";

@Entity("httpPush")
export class HttpPush {

    @PrimaryColumn()
    targetUrl: string;

    @Column()
    timeout: string;

    @Column()
    authorizationHeader : string;

    toString(): string {
        return `targetUrl: ${this.targetUrl} - timeout:${this.timeout} authorizationHeader: ${this.authorizationHeader}`;
    }
}
