import { Length, Max } from "class-validator";
import { BeforeInsert, ChildEntity, Column } from "typeorm";

import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceType } from "@enum/device-type.enum";

@ChildEntity(IoTDeviceType.SigFox)
export class SigFoxDevice extends IoTDevice {
    @Column({ nullable: true })
    @Max(8, { message: "Must at most be 8 characters" })
    deviceId: string;

    @Column({ nullable: true })
    @Max(24, { message: "Must at most be 24 characters" })
    deviceTypeId: string;

    @BeforeInsert()
    private beforeInsert() {
        this.type = IoTDeviceType.SigFox;
    }
}
