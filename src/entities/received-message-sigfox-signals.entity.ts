import { DbBaseEntity } from "@entities/base.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity("received_message_sigfox_signals")
export class ReceivedMessageSigFoxSignals extends DbBaseEntity {
    @ManyToOne(() => IoTDevice, device => device.receivedSigFoxSignalsMessages, {
        onDelete: "CASCADE",
    })
    device: IoTDevice;

    @Column({
        comment: "Time reported by device (if possible, otherwise time received)",
    })
    sentTime: Date;

    @Column({ nullable: true })
    rssi?: number;

    @Column({ nullable: true })
    snr?: number;
}
