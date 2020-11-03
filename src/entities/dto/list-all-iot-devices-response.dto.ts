import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { IoTDevice } from "@entities/iot-device.entity";

export class ListAllIoTDevicesResponseDto extends ListAllEntitiesResponseDto<IoTDevice> {}
