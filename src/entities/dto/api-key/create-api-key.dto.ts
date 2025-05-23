import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString, Length } from "class-validator";
import { IsSwaggerOptional } from "@helpers/optional-validator";
import { ValidateDate } from "@helpers/date.validator";

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

  @IsSwaggerOptional()
  @ValidateDate()
  expiresOn?: Date;
}
