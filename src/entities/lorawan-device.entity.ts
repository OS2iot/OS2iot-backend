import { Length } from "class-validator";
import { BeforeInsert, ChildEntity, Column } from "typeorm";

import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";

@ChildEntity(IoTDeviceType.LoRaWAN)
export class LoRaWANDevice extends IoTDevice {
    /**
     * This is used to identify the LoRaWAN device in Chirpstack,
     * the remaining information is only stored in Chirpstack.
     */
    @Column({ nullable: true })
    @Length(16, 16, { message: "Must be 16 characters" })
    deviceEUI: string;

    @Column({ nullable: true })
    chirpstackApplicationId: number;

    @BeforeInsert()
    private beforeInsert() {
        this.type = IoTDeviceType.LoRaWAN;
    }
}
