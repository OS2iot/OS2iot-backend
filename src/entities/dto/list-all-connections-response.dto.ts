import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";

export class ListAllConnectionsResponseDto extends ListAllEntitiesResponseDto<
    IoTDevicePayloadDecoderDataTargetConnection
> {}
