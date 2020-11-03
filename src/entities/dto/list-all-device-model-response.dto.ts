import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { DeviceModel } from "@entities/device-model.entity";

export class ListAllDeviceModelResponseDto extends ListAllEntitiesResponseDto<
    DeviceModel
> {}
