import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({ default: "john@localhost.dk" })
    username: string;
    @ApiProperty({ default: "hunter2" })
    password: string;
}
