import { ApiProperty, ApiProduces } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class CreateUserDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    password: string;
}
