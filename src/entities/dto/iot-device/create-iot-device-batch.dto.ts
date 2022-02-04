import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { HasSameApplicationId } from "@helpers/has-same-application-id.validator";
import { nameof } from "@helpers/type-helper";
import { ArrayMaxSize, ArrayNotEmpty } from "class-validator";

export class CreateIoTDeviceBatchDto {
    @ArrayNotEmpty()
    @ArrayMaxSize(50)
    @HasSameApplicationId(nameof<CreateIoTDeviceBatchDto>("data"), {
        applicationIdName: nameof<CreateIoTDeviceDto>("applicationId"),
    })
    data: CreateIoTDeviceDto[];
}
