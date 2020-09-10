import { Entity, ManyToOne, JoinColumn, Index } from "typeorm";
import { DbBaseEntity } from "@entities//base.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { DataTarget } from "@entities/data-target.entity";

/**
 * I hate this name, but not sure what else to call this join-table.-
 */
@Entity("iot_device_payload_decoder_data_target_connection")
@Index(["iotDevice"])
@Index(["payloadDecoder"])
@Index(["dataTarget"])
export class IoTDevicePayloadDecoderDataTargetConnection extends DbBaseEntity {
    @ManyToOne(() => IoTDevice, { onDelete: "CASCADE" })
    @JoinColumn()
    iotDevice: IoTDevice;

    @ManyToOne(() => PayloadDecoder, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn()
    payloadDecoder?: PayloadDecoder;

    @ManyToOne(() => DataTarget, { onDelete: "CASCADE" })
    @JoinColumn()
    dataTarget: DataTarget;
}
