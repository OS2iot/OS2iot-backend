import { BeforeInsert, ChildEntity, Column } from "typeorm";
import { IoTDeviceType } from "@enum/device-type.enum";
import { IoTDevice } from "@entities/iot-device.entity";
import { AuthenticationType } from "@enum/authentication-type.enum";
import { MQTTPermissionLevel } from "@enum/mqtt-permission-level.enum";

@ChildEntity(IoTDeviceType.MQTTBroker)
export class MQTTBrokerDevice extends IoTDevice {
    // TODO: Add missing fields (url etc.)
    @Column("enum", {
        enum: AuthenticationType,
    })
    authenticationType: AuthenticationType;

    @Column({ nullable: true })
    certificate: string; // TODO: Better type available?

    @Column({ nullable: true })
    mqttUsername: string;

    @Column({ nullable: true })
    mqttPassword: string;

    @Column({ nullable: true })
    mqttURL: string;

    @Column({ nullable: true })
    mqttTopicName: string;

    // @Column({ nullable: true })
    // permissions: MQTTPermissionLevel;

    @BeforeInsert()
    private beforeInsert() {
        this.type = IoTDeviceType.MQTTBroker;
    }
}
