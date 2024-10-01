import { IsInt, IsJSON, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";

export class TestDataTargetDto {
  @ApiProperty({ required: true })
  @IsInt()
  dataTargetId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  iotDeviceId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  payloadDecoderId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsJSON()
  dataPackage?: string;
}

export interface TestDataTargetResultDto {
  result: DataTargetSendStatus | Error;
  decodedPayload?: JSON;
}
