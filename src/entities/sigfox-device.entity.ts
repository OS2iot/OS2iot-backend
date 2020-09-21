import { IoTDevice } from "@entities/iot-device.entity";
import { Column, ChildEntity, BeforeInsert } from "typeorm";
import { IoTDeviceType } from "@enum/device-type.enum";
import { Length, Max } from "class-validator";

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
