import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNumber } from "class-validator";

export class CreateDeviceModelDto {
  @ApiProperty({ required: true })
  @IsNumber()
  belongsToId: number;

  @ApiProperty({ required: true })
  // @IsJSON or @IsString does not work. Will be validated during the flow
  @IsDefined()
  body: JSON;
}
