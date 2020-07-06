import { v4 as uuidv4 } from "uuid";
import { IoTDevice } from "@entities/iot-device.entity";
import { Column, ChildEntity, BeforeInsert } from "typeorm";
import { IoTDeviceType } from "@enum/device-type.enum";

@ChildEntity(IoTDeviceType.GenericHttp)
export class GenericHTTPDevice extends IoTDevice {
    @Column({
        nullable: true,
        type: "varchar",
        comment: "Used for GenericHTTPDevice",
    })
    apiKey: string;

    @BeforeInsert()
    private beforeInsert() {
        /**
         * Generate uuid (version 4 = random) to be used as the apiKey for this GenericHTTPDevice
         */
        this.apiKey = uuidv4();
        this.type = IoTDeviceType.GenericHttp;
    }
}
