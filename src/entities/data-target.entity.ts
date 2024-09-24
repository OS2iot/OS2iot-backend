import { Column, Entity, ManyToOne, OneToMany, OneToOne, TableInheritance } from "typeorm";

import { Application } from "@entities/application.entity";
import { DbBaseEntity } from "@entities/base.entity";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { IoTDevicePayloadDecoderDataTargetConnection } from "./iot-device-payload-decoder-data-target-connection.entity";

@Entity("data_target")
@TableInheritance({
  column: { type: "enum", name: "type", enum: DataTargetType },
})
export abstract class DataTarget extends DbBaseEntity {
  @Column("enum", {
    enum: DataTargetType,
  })
  type: DataTargetType;

  @Column()
  name: string;

  @Column({ nullable: true })
  lastMessageDate?: Date;

  @ManyToOne(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => Application,
    application => application.iotDevices,
    { onDelete: "CASCADE" }
  )
  application: Application;

  @OneToMany(type => IoTDevicePayloadDecoderDataTargetConnection, c => c.dataTarget)
  connections: IoTDevicePayloadDecoderDataTargetConnection[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne(type => OpenDataDkDataset, o => o.dataTarget, {
    nullable: true,
    cascade: true,
  })
  openDataDkDataset: OpenDataDkDataset;
}
