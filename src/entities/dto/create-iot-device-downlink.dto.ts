import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";

export class CreateIoTDeviceDownlinkDto {
    @ApiProperty({ required: true })
    @Matches(/^[0-9A-Fa-f]+$/, { message: "Must be hexadecimal" })
    data: string;
}
