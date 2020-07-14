import { ListAllEntitiesResponseDto } from "@dto/list/list-all-entities-reponse.dto";
import { IoTDevice } from "@entities/iot-device.entity";

export class ListAllIoTDevicesReponseDto extends ListAllEntitiesResponseDto<
    IoTDevice
> {}
