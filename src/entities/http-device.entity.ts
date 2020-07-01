import { IoTDevice } from "./iot-device.entity";
import { Column, ChildEntity } from "typeorm";

@ChildEntity()
export class HTTPDevice extends IoTDevice {
    @Column()
    secretKey: string;
}
