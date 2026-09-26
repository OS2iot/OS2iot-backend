import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { IsPhoneNumberString } from "@helpers/phone-number.validator";
import { nameof } from "@helpers/type-helper";

export class CreateContactPersonDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @MaxLength(100)
  role?: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ required: true })
  @IsPhoneNumberString(nameof<CreateContactPersonDto>("phone"))
  @MaxLength(12)
  phone?: string;
}
