import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class CreateUserDto {
    @ApiProperty({ required: true })
    name: string;

    @ApiProperty({ required: true })
    @IsEmail()
    email: string;

    @ApiProperty({ required: true })
    password: string;

    @ApiProperty({ required: true })
    active: boolean;

    @ApiProperty({ required: false })
    globalAdmin?: boolean;
}
