import { Column, Entity, ManyToOne, } from "typeorm";
import { DbBaseEntity } from "./base.entity";
import { LoRaWANDevice } from "./lorawan-device.entity";

@Entity("downlink")
export class Downlink extends DbBaseEntity {
  @Column()
  queueItemId: string;

  @Column({ nullable: true })
  fCntDown: number;

  @Column()
  payload: string;

  @Column()
  port: number;

  @Column({ nullable: true })
  sendAt: Date;

  @Column({ nullable: true })
  acknowledgedAt: Date;

  @Column({ nullable: true })
  acknowledged: boolean;

  @Column({ nullable: true })
  flushed: boolean;

  @Column()
  lorawanDeviceId: number;

  @ManyToOne(() => LoRaWANDevice, lorawanDevice => lorawanDevice.downlinks, { onDelete: "CASCADE" })
  lorawanDevice: LoRaWANDevice;
}
