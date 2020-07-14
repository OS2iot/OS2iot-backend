import { Entity, Column, ManyToMany,OneToMany, ManyToOne,OneToOne } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import {
    PrimaryColumn,
} from "typeorm";
import { IoTDevice } from "./iot-device.entity";
import { Application } from "./applikation.entity";
import { HttpPush } from "./http-push.entity";


@Entity("dataTarget")
export class DataTarget extends DbBaseEntity {

    @Column()
    targetName: string;

    @Column("simple-array")
    applicationId: number;

    @Column("simple-array")
    devices: string;

    @Column("simple-array")
    httpPushId: number;

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Application,
        application => application.iotDevices,
    )
    application: Application;
    
    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => IoTDevice,
        iotdevice => iotdevice.application,
    )
    iotDevices: IoTDevice[];

    
    @OneToOne(
        type => HttpPush,
        httpPush => httpPush.dataTarget,
    )
    httpPush: HttpPush[];



    toString(): string {
        return `id: ${this.id} - targetName: ${this.targetName} - applicationId:${this.applicationId} devices: ${this.devices}`;
    }
}
