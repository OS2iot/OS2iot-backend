import {BeforeInsert, ChildEntity, Column} from "typeorm";
import {IoTDeviceType} from "@enum/device-type.enum";
import {IoTDevice} from "@entities/iot-device.entity";
import {AuthenticationType} from "@enum/authentication-type";

@ChildEntity(IoTDeviceType.MQTTBroker)
export class MQTTBrokerDevice extends IoTDevice {
    // TODO: Add missing fields
    @Column("enum", {
        enum: AuthenticationType
    })
    authenticationType: AuthenticationType;

    @Column( {nullable: true})
    certificate: string; // TODO: Better type available?

    @Column({nullable: true})
    username: string;

    @Column({nullable: true})
    password: string;

    @BeforeInsert()
    private beforeInsert() {
        this.type = IoTDeviceType.MQTTBroker
    }
}
