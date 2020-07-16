import { Entity, Column, OneToMany, ManyToOne } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { HttpPushTarget } from "@entities/http-push-target.entity";

@Entity("application")
export class Application extends DbBaseEntity {
    @Column()
    name: string;

    @Column()
    description: string;

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => IoTDevice,
        iotdevice => iotdevice,
        { onDelete: "CASCADE" }
    )
    iotDevices: IoTDevice[];

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => HttpPushTarget,
        httpPushTarget => httpPushTarget,
        { onDelete: "CASCADE" }
    )
    httpPushTarget: HttpPushTarget[];

    toString(): string {
        return `httpPushTarget: id: ${this.id} - name: ${this.name}`;
    }
}
