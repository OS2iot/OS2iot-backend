import { DbBaseEntity } from "@entities/base.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";

@Entity("received_message")
export class ReceivedMessage extends DbBaseEntity {
  @OneToOne(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => IoTDevice,
    device => device.latestReceivedMessage,
    { onDelete: "CASCADE" }
  )
  @JoinColumn()
  device: IoTDevice;

  @Column({ type: "jsonb" })
  rawData: JSON;

  @Column({
    comment: "Time reported by device (if possible, otherwise time received)",
  })
  sentTime: Date;

  @Column({ nullable: true })
  rssi?: number;

  @Column({ nullable: true })
  snr?: number;
}
