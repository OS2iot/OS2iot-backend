import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CreateDeviceModelDto {
    @ApiProperty({ required: true })
    @IsNumber()
    belongsToId: number;

    @ApiProperty({ required: true })
    body: JSON;
}

