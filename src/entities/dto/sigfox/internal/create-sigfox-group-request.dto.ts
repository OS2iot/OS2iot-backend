import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateSigFoxGroupRequestDto {
    @ApiProperty({ required: true })
    @IsNumber()
    organizationId: number;

    @ApiProperty({ required: true })
    @IsString()
    username: string;

    @ApiProperty({ required: true })
    @IsString()
    password: string;
}
