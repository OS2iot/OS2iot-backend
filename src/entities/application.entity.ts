import { Entity, Column, OneToMany } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { DataTarget } from "@entities/data-target.entity";

@Entity("application")
export class Application extends DbBaseEntity {
    @Column()
    name: string;

    @Column()
    description: string;

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => IoTDevice,
        iotdevice => iotdevice.application,
        { onDelete: "CASCADE" }
    )
    iotDevices: IoTDevice[];

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => DataTarget,
        datatarget => datatarget.application,
        { onDelete: "CASCADE" }
    )
    dataTargets: DataTarget[];
}
