import { ApiProperty } from "@nestjs/swagger";
import { IsHexadecimal, IsInt, Min } from "class-validator";

export class CreateMulticastDownlinkDto {
    @ApiProperty({ required: true })
    @IsHexadecimal()
    data: string;

    @ApiProperty({ required: true, example: 1 })
    @IsInt()
    @Min(1)
    port: number;
}
