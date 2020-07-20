import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateRecieveDataDto {
    @ApiProperty()
    @IsNotEmpty()
    data: JSON;
}
