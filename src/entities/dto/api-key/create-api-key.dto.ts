import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString, Length } from "class-validator";

export class CreateApiKeyDto {
  @ApiProperty({ required: true })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({
    required: true,
    type: "array",
    items: {
      type: "number",
    },
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  permissionIds: number[];
}
