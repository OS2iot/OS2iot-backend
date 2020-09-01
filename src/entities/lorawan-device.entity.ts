import { v4 as uuidv4 } from "uuid";
import { IoTDevice } from "@entities/iot-device.entity";
import { Column, ChildEntity, BeforeInsert } from "typeorm";
import { IoTDeviceType } from "@enum/device-type.enum";
import { Length } from "class-validator";

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
