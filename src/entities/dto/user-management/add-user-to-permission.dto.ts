import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsArray, ArrayUnique, ArrayNotEmpty } from "class-validator";

export class PermissionRequestAcceptUser {
  @ApiProperty({ required: true })
  @IsNumber()
  organizationId: number;

  @ApiProperty({ required: true })
  @IsNumber()
  userId: number;

  @ApiProperty({ required: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  permissionIds: number[];
}
