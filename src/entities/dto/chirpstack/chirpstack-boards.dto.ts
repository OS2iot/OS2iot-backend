import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ChirpstackBoardsDto {
    @ApiProperty({ required: false })
    @IsString()
    fineTimestampKey: string;

    @ApiProperty({ required: false })
    @IsString()
    fpgaID: string;
}
