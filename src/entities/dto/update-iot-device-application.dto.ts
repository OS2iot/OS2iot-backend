import { ApiProperty } from "@nestjs/swagger";

interface DataTargetToPayloadDecoder {
  dataTargetId: number;
  payloadDecoderId: number;
}

export class UpdateIoTDeviceApplication {
  public deviceModelId: number;
  public organizationId: number;
  public applicationId: number;
  @ApiProperty({ required: true })
  public dataTargetToPayloadDecoderIds: DataTargetToPayloadDecoder[];
}
