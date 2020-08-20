import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-reponse.dto";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";

export class ListAllConnectionsReponseDto extends ListAllEntitiesResponseDto<
    IoTDevicePayloadDecoderDataTargetConnection
> {}
