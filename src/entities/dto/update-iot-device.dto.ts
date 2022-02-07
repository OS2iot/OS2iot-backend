import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { StringToNumber } from "@helpers/string-to-number-validator";
import { Min } from "class-validator";

export class UpdateIoTDeviceDto extends CreateIoTDeviceDto {
    @StringToNumber()
    @Min(1)
    id: number;
}
