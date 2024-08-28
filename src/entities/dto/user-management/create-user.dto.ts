import { IsNotBlank } from "@helpers/is-not-blank.validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

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
}
