import { DataTarget } from "@entities/data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { QoS } from "@enum/qos.enum";
import { MqttDataTargetConfiguration } from "@interfaces/mqtt-data-target-configuration.interface";
import { BeforeInsert, ChildEntity, Column } from "typeorm";

@ChildEntity(DataTargetType.MQTT)
export class MqttDataTarget extends DataTarget {
  @Column()
  url: string;

  @Column({ default: 30000, comment: "HTTP call timeout in milliseconds" })
  timeout: number;

  @Column({ nullable: true })
  mqttPort?: number;

  @Column({ nullable: true })
  mqttTopic?: string;

  @Column({ nullable: true })
  mqttQos?: QoS;

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
      port: this.mqttPort,
      topic: this.mqttTopic,
      qos: this.mqttQos,
      timeout: this.timeout,
      username: this.mqttUsername,
      password: this.mqttPassword,
    };
  }
}
