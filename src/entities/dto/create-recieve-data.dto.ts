import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsJSON, MinLength, MaxLength } from "class-validator";

export class CreateRecieveDataDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsJSON()
    data: JSON;
}
