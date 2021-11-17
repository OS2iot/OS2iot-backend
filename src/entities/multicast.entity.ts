import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";

import { Application } from "@entities/application.entity";
import { DbBaseEntity } from "@entities/base.entity";
import { IoTDevice } from "./iot-device.entity";

@Entity("multicast")
export class Multicast extends DbBaseEntity {
    @Column()
    groupName: string;

    @Column()
    address: string;
    @Column()
    networkSessionKey: string;

    @Column()
    applicationSessionKey: string;

    @Column()
    frameCounter: number;

    @Column()
    dataRate: number;

    @Column()
    frequency: number;

    @Column()
    groupType: string;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Application,
        application => application.multicasts,
        { onDelete: "CASCADE" }
    )
    application: Application;

    @ManyToMany(() => IoTDevice, iotDevices => iotDevices.multicasts)
    iotDevices: IoTDevice[];
}
