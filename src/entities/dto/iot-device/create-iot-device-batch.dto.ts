import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { ArrayMaxSize, ArrayNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreateIoTDeviceBatchDto {
    @ArrayNotEmpty()
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => CreateIoTDeviceDto)
    data: CreateIoTDeviceDto[];
}
