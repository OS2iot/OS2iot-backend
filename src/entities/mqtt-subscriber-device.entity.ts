import { IoTDevice } from "@entities/iot-device.entity";
import { BeforeInsert, ChildEntity, Column } from "typeorm";
import { AuthenticationType } from "@enum/authentication-type.enum";
import { IoTDeviceType } from "@enum/device-type.enum";

@ChildEntity(IoTDeviceType.MQTTSubscriber)
export class MQTTSubscriberDevice extends IoTDevice {
    @Column("enum", {
        enum: AuthenticationType,
    })
    authenticationType: AuthenticationType;

    @Column({ nullable: true })
    caCertificate: string;

    @Column({ nullable: true })
    deviceCertificate: string;

    @Column({ nullable: true })
    deviceCertificateKey: string;

    @Column({ nullable: true })
    mqttusername: string;

    @Column({ nullable: true })
    mqttpassword: string;

    @Column({ nullable: true })
    mqttURL: string;

    @Column({ nullable: true })
    mqttPort: number;

    @Column({ nullable: true })
    mqtttopicname: string;

    @Column({ default: false })
    invalidMqttConfig: boolean;

    @BeforeInsert()
    private beforeInsert() {
        this.type = IoTDeviceType.MQTTSubscriber;
    }
}
