import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class RejectUserDto {
    @ApiProperty({ required: true })
    @IsNumber()
    orgId: number;

    @ApiProperty({ required: true })
    @IsNumber()
    userIdToReject: number;
}
