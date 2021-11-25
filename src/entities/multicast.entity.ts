import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { Application } from "@entities/application.entity";
import { IoTDevice } from "./iot-device.entity";
import { multicastGroup } from "@enum/multicast-type.enum";

@Entity("multicast")
export class Multicast {
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
    groupType: multicastGroup;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Application,
        application => application.multicasts,
        { onDelete: "CASCADE" }
    )
    application: Application;

    @ManyToMany(() => IoTDevice, iotDevices => iotDevices.multicasts)
    iotDevices: IoTDevice[];

    @PrimaryColumn()
    multicastId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne("User", { nullable: true })
    @JoinColumn()
    createdBy?: number;

    @ManyToOne("User", { nullable: true })
    @JoinColumn()
    updatedBy?: number;
}
