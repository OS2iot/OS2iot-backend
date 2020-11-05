import { ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { IsEmail, IsOptional } from "class-validator";

import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends OmitType(CreateUserDto, ["email", "password"]) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    password?: string;
}
