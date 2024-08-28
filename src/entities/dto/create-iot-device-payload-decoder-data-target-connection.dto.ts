import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class CreateIoTDevicePayloadDecoderDataTargetConnectionDto {
  @ApiProperty({
    required: true,
    type: "array",
    items: {
      type: "number",
    },
  })
  iotDeviceIds: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  payloadDecoderId?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  dataTargetId: number;
}
