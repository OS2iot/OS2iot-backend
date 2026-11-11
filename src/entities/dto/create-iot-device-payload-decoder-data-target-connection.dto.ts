import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional } from "class-validator";

export class CreateIoTDevicePayloadDecoderDataTargetConnectionDto {
  @ApiProperty({
    required: true,
    type: "array",
    items: {
      type: "number",
    },
  })
  iotDeviceIds: number[];

  @ApiProperty({ required: true })
  @IsOptional()
  payloadDecoderId?: number;

  @ApiProperty({ required: true })
  @IsNumber()
  dataTargetId: number;

  @ApiProperty({ required: true })
  @IsNumber()
  applicationId: number;

  @ApiProperty({ required: true })
  @IsBoolean()
  defaultConnection: boolean;
}
