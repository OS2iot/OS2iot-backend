import { Length } from "class-validator";
import { Point } from "geojson";
import {
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    TableInheritance,
} from "typeorm";

import { Application } from "@entities/application.entity";
import { DbBaseEntity } from "@entities/base.entity";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { ReceivedMessage } from "@entities/received-message";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata";
import { IoTDeviceType } from "@enum/device-type.enum";

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

    @ManyToMany(
        () => IoTDevicePayloadDecoderDataTargetConnection,
        connection => connection.iotDevices
    )
    connections: IoTDevicePayloadDecoderDataTargetConnection[];

    toString(): string {
        return `IoTDevices: id: ${this.id} - name: ${this.name}`;
    }
}
