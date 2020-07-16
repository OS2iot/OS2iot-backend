import { Entity, Column, ManyToMany,OneToMany, ManyToOne,OneToOne } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import {
    PrimaryColumn,
} from "typeorm";
import { IoTDevice } from "./iot-device.entity";
import { Application } from "./applikation.entity";
import { HttpPushTarget } from "./http-push-target.entity";


@Entity("dataTarget")
export class DataTarget extends DbBaseEntity {

    @Column()
    targetName: string;

    @Column()
    applicationId: number;

    @Column()
    TargetId: number;
 
    toString(): string {
        return `id: ${this.id} - targetName: ${this.targetName} - applicationId:${this.applicationId} `;
    }
}
