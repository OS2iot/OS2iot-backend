import { Length } from "class-validator";
import { BeforeInsert, ChildEntity, Column, OneToMany } from "typeorm";
import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { Downlink } from "./downlink.entity";

@ChildEntity(IoTDeviceType.LoRaWAN)
export class LoRaWANDevice extends IoTDevice {
  @Column({ nullable: true })
  @Length(16, 16, { message: "Must be 16 characters" })
  deviceEUI: string;

  @Column({ nullable: true })
  @Length(32, 32, { message: "Must be 32 characters" })
  OTAAapplicationKey: string;

  @Column({ nullable: true })
  deviceProfileName: string;

  @Column({ nullable: true })
  chirpstackApplicationId: string;

  @OneToMany(() => Downlink, downlink => downlink.lorawanDevice, { cascade: true })
  downlinks: Downlink[];

  @BeforeInsert()
  private beforeInsert() {
    this.type = IoTDeviceType.LoRaWAN;
  }
}
