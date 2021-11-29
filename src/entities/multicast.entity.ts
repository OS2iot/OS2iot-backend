import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from "typeorm";

import { Application } from "@entities/application.entity";
import { IoTDevice } from "./iot-device.entity";
import { LorawanMulticastDefinition } from "./lorawan-multicast.entity";
import { DbBaseEntity } from "./base.entity";

@Entity("multicast")
export class Multicast extends DbBaseEntity {
    @Column()
    groupName: string;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Application,
        application => application.multicasts,
        { onDelete: "CASCADE" }
    )
    application: Application;

    @ManyToMany(() => IoTDevice, iotDevices => iotDevices.multicasts)
    iotDevices: IoTDevice[];

    @OneToOne(type => LorawanMulticastDefinition, lorawanMulticastDefinition => lorawanMulticastDefinition.multicast, {cascade: true})
    @JoinColumn()
    lorawanMulticastDefinition: LorawanMulticastDefinition;
}
