import { IsNotBlank } from "@helpers/is-not-blank.validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";
import { IsSwaggerOptional } from "@helpers/optional-validator";
import { ValidateDate } from "@helpers/date.validator";

export class CreateUserDto {
  @ApiProperty({ required: true })
  @IsString()
  @Length(1, 50)
  @IsNotBlank("name")
  name: string;

  @ApiProperty({ required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @Length(6, 50)
  @IsString()
  password: string;

  @ApiProperty({ required: true })
  active: boolean;

  @ApiProperty({ required: false })
  globalAdmin?: boolean;

  @ApiProperty({ required: false })
  permissionIds?: number[];

  @IsSwaggerOptional()
  @ValidateDate()
  expiresOn?: Date;
}
