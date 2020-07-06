import { Entity, Column, OneToMany } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { IoTDevice } from "@entities/iot-device.entity";

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

    toString(): string {
        return `Application: id: ${this.id} - name: ${this.name}`;
    }
}
