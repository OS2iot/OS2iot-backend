import { Column, ManyToOne, Entity, TableInheritance } from "typeorm";
import { DbBaseEntity } from "./base.entity";
import { Application } from "./applikation.entity";

@Entity("iot_device")
@TableInheritance({ column: { type: "varchar", name: "type" } })
export abstract class IoTDevice extends DbBaseEntity {
    @Column()
    name: string;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Application,
        application => application.iotDevices
    )
    application: Application;

    toString(): string {
        return `IoTDevices: id: ${this.id} - name: ${this.name}`;
    }
}
