import { Entity, ManyToOne, JoinColumn, Index, ManyToMany, JoinTable } from "typeorm";
import { DbBaseEntity } from "@entities//base.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { DataTarget } from "@entities/data-target.entity";

/**
 * I hate this name, but not sure what else to call this join-table.-
 */
@Entity("iot_device_payload_decoder_data_target_connection")
@Index(["payloadDecoder"])
@Index(["dataTarget"])
export class IoTDevicePayloadDecoderDataTargetConnection extends DbBaseEntity {
    @ManyToMany(() => IoTDevice, iotdevice => iotdevice.connections)
    @JoinTable()
    iotDevices: IoTDevice[];

    @ManyToOne(() => PayloadDecoder, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn()
    payloadDecoder?: PayloadDecoder;

    @ManyToOne(() => DataTarget, { onDelete: "CASCADE" })
    @JoinColumn()
    dataTarget: DataTarget;
}
