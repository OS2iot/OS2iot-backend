import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class AppendCopiedDeviceDto {
  @ApiProperty({ required: true })
  @IsNumber()
  deviceId: number;
}
