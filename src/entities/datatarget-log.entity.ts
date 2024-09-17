import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { DbBaseEntity } from "./base.entity";
import { DataTarget } from "./data-target.entity";
import { IoTDevice } from "./iot-device.entity";
import { PayloadDecoder } from "./payload-decoder.entity";

@Entity("datatarget-log")
export class DatatargetLog extends DbBaseEntity {
  @ManyToOne(() => IoTDevice, { onDelete: "CASCADE" })
  @JoinColumn()
  datatarget: DataTarget;

  // TODO: Enum??
  @Column()
  type: string;

  @Column()
  statusCode?: number;

  @Column()
  message?: string;

  // TODO: Maybe better if we could null the reference instead - log could still be valuable without this ref, for debugging datatarget
  @ManyToOne(() => IoTDevice, { onDelete: "CASCADE" })
  @JoinColumn()
  iotDevice?: IoTDevice;

  // TODO: Maybe better if we could null the reference instead - log could still be valuable without this ref, for debugging datatarget
  @ManyToOne(() => PayloadDecoder, { onDelete: "CASCADE" })
  @JoinColumn()
  payloadDecoder?: PayloadDecoder;

}
