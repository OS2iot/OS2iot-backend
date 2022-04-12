import { DataTarget } from "@entities/data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { MqttDataTargetConfiguration } from "@interfaces/mqtt-data-target-configuration.interface";
import { BeforeInsert, ChildEntity, Column } from "typeorm";

@ChildEntity(DataTargetType.MQTT)
export class MqttDataTarget extends DataTarget {
    @Column()
    url: string;

    @Column({ default: 30000, comment: "HTTP call timeout in milliseconds" })
    timeout: number;

    @Column({ nullable: true })
    mqttTopic?: string;

    @Column({ nullable: true })
    mqttUsername?: string;

    @Column({ nullable: true })
    mqttPassword?: string;

    @BeforeInsert()
    private beforeInsert() {
        this.type = DataTargetType.MQTT;
    }

    toConfiguration(): MqttDataTargetConfiguration {
        return {
            url: this.url,
            topic: this.mqttTopic,
            timeout: this.timeout,
            username: this.mqttUsername,
            password: this.mqttPassword,
        };
    }
}
