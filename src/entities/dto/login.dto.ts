import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ default: "john@localhost.dk" })
  @IsString()
  username: string;
  @ApiProperty({ default: "hunter2" })
  @IsString()
  password: string;
}
