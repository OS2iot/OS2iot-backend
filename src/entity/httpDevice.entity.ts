import { IoTDevice } from "./iotdevice.entity";
import { Column, ChildEntity } from "typeorm";

@ChildEntity()
export class HTTPDevice extends IoTDevice {
    @Column()
    secretKey: string;
}
