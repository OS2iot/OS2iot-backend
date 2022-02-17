import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { ArrayMaxSize, ArrayNotEmpty } from "class-validator";

export class CreateIoTDeviceBatchDto {
    @ArrayNotEmpty()
    @ArrayMaxSize(50)
    data: CreateIoTDeviceDto[];
}
