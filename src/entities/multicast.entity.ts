import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne } from "typeorm";

import { Application } from "@entities/application.entity";
import { IoTDevice } from "./iot-device.entity";
import { LorawanMulticastDefinition } from "./lorawan-multicast.entity";
import { DbBaseEntity } from "./base.entity";

@Entity("multicast")
export class Multicast extends DbBaseEntity {
    @Column()
    groupName: string;

    @ManyToOne(_ => Application, application => application.multicasts, { onDelete: "CASCADE" })
    application: Application;

    @ManyToMany(() => IoTDevice, iotDevices => iotDevices.multicasts)
    @JoinTable()
    iotDevices: IoTDevice[];

    @OneToOne(type => LorawanMulticastDefinition, lorawanMulticastDefinition => lorawanMulticastDefinition.multicast, {
        cascade: true,
    })
    @JoinColumn()
    lorawanMulticastDefinition: LorawanMulticastDefinition;
}
