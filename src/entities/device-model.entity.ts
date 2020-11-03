import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { DbBaseEntity } from "./base.entity";
import { IoTDevice } from "./iot-device.entity";
import { Organization } from "./organization.entity";

@Entity("device_model")
export class DeviceModel extends DbBaseEntity {
    @Column({ type: "jsonb", nullable: true })
    body: JSON;

    @ManyToOne(type => Organization, organization => organization.deviceModels)
    @JoinColumn()
    belongsTo: Organization;

    @OneToMany(type => IoTDevice, device => device.deviceModel)
    devices: IoTDevice[];
}
