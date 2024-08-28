import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { ArrayMaxSize, ArrayNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class UpdateIoTDeviceBatchDto {
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UpdateIoTDeviceDto)
  data: UpdateIoTDeviceDto[];
}
