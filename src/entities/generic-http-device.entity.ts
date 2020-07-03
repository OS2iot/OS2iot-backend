import { v4 as uuidv4 } from 'uuid';
import { IoTDevice } from "@entities/iot-device.entity";
import { Column, ChildEntity, BeforeInsert } from "typeorm";

@ChildEntity()
export class GenericHTTPDevice extends IoTDevice {
    @Column()
    apiKey: string;
    device: ({ name: string; description: string; } & IoTDevice)[];

    @BeforeInsert()
    private beforeInsert() {
        /**
         * Generate uuid (version 4 = random) to be used as the apiKey for this GenericHTTPDevice
         */
        this.apiKey = uuidv4()
    }
}
