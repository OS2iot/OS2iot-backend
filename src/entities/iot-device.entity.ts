import {
    Column,
    ManyToOne,
    Entity,
    TableInheritance,
    OneToMany,
    OneToOne,
    JoinColumn,
} from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { Application } from "@entities/application.entity";
import { Length } from "class-validator";
import { Point } from "geojson";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { ReceivedMessage } from "@entities/received-message";

@Entity("iot_device")
@TableInheritance({
    column: { type: "enum", name: "type", enum: IoTDeviceType },
})
export abstract class IoTDevice extends DbBaseEntity {
    @Column()
    name: string;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Application,
        application => application.iotDevices,
        { onDelete: "CASCADE" }
    )
    application: Application;

    @Column({
        type: "geometry",
        nullable: true,
        spatialFeatureType: "Point",
        srid: 4326,
    })
    location?: Point;

    @Column({ nullable: true })
    @Length(0, 1024)
    commentOnLocation?: string;

    @Column({ nullable: true })
    @Length(0, 1024)
    comment?: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: JSON;

    @Column("enum", {
        enum: IoTDeviceType,
    })
    type: IoTDeviceType;

    @OneToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => ReceivedMessage,
        latestReceivedMessage => latestReceivedMessage.device
    )
    @JoinColumn()
    latestReceivedMessage: ReceivedMessage;

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => ReceivedMessageMetadata,
        receivedMessagesMetadata => receivedMessagesMetadata.device,
        { onDelete: "CASCADE" }
    )
    receivedMessagesMetadata: ReceivedMessageMetadata[];

    toString(): string {
        return `IoTDevices: id: ${this.id} - name: ${this.name}`;
    }
}
