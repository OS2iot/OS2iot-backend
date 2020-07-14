import { Entity, Column, OneToMany, ManyToOne } from "typeorm";
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

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => DataTarget,
        dataTarget => dataTarget.application,
        { onDelete: "CASCADE" }
    )
    dataTarget: DataTarget[];

    toString(): string {
        return `Application: id: ${this.id} - name: ${this.name}`;
    }
}
