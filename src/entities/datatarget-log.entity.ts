import { SendStatus } from "@enum/send-status.enum";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { DbBaseEntity } from "./base.entity";
import { DataTarget } from "./data-target.entity";
import { IoTDevice } from "./iot-device.entity";
import { PayloadDecoder } from "./payload-decoder.entity";

@Entity("datatarget-log")
@Index(["datatarget", "createdAt"])
export class DatatargetLog extends DbBaseEntity {
  @ManyToOne(() => DataTarget, { onDelete: "CASCADE" })
  @JoinColumn()
  datatarget: DataTarget;

  @Column()
  type: SendStatus;

  @Column()
  statusCode?: number;

  @Column()
  message?: string;

  @ManyToOne(() => IoTDevice, { onDelete: "SET NULL" })
  @JoinColumn()
  iotDevice?: IoTDevice;

  @ManyToOne(() => PayloadDecoder, { onDelete: "SET NULL" })
  @JoinColumn()
  payloadDecoder?: PayloadDecoder;
}
