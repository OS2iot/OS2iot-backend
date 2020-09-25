import { Entity, Column, OneToOne } from "typeorm";
import { IoTDevice } from "@entities/iot-device.entity";
import { DbBaseEntity } from "@entities/base.entity";

@Entity("received_message")
export class ReceivedMessage extends DbBaseEntity {
    @OneToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => IoTDevice,
        device => device.latestReceivedMessage
    )
    device: IoTDevice;

    @Column({ type: "jsonb" })
    rawData: JSON;

    @Column({
        comment: "Time reported by device (if possible, otherwise time received)",
    })
    sentTime: Date;
}
