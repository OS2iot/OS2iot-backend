import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { DbBaseEntity } from "./base.entity";
import { IoTDevice } from "./iot-device.entity";
import { Organization } from "./organization.entity";

@Entity("device_model")
export class DeviceModel extends DbBaseEntity {
    @Column({ type: "jsonb", nullable: true })
    body: JSON;

    @ManyToOne(
        type => Organization,
        organization => organization.deviceModels
    )
    belongsTo: Organization;

    @OneToMany(type => IoTDevice, device => device.deviceModel, { onDelete: "SET NULL" })
    devices: IoTDevice[];
}
