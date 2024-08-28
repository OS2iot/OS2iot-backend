import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsSwaggerOptional } from "@helpers/optional-validator";

export class ListAllIoTDevicesMinimalResponseDto {
  @ApiProperty()
  data: IoTDeviceMinimal[];
  @ApiProperty()
  count: number;
}

export class IoTDeviceMinimal {
  id: number;

  name: string;

  canRead: boolean;

  applicationId: number;

  organizationId: number;

  lastActiveTime: Date;
}

export class IoTDeviceMinimalRaw {
  id: number;

  name: string;

  applicationId: number;

  organizationId: number;

  sentTime: Date;
}

export class PayloadDecoderIoDeviceMinimalQuery {
  @IsSwaggerOptional()
  limit? = 20;

  @IsSwaggerOptional()
  offset? = 0;
}
