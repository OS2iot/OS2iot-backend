import { Column, Entity, Index, ManyToOne } from "typeorm";

import { DbBaseEntity } from "@entities/base.entity";
import { IoTDevice } from "@entities/iot-device.entity";

@Entity("received_message_metadata")
@Index(["device", "sentTime"])
export class ReceivedMessageMetadata extends DbBaseEntity {
    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => IoTDevice,
        device => device.receivedMessagesMetadata,
        { onDelete: "CASCADE" }
    )
    device: IoTDevice;

    @Column({
        comment: "Time reported by device (if possible, otherwise time received)",
    })
    sentTime: Date;

    @Column({ type: "jsonb", nullable: true })
    signalData?: JSON;
}
