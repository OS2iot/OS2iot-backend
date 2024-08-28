import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class AdrAlgorithmDto {
    @ApiProperty({ required: true })
    @IsString()
    @Length(1, 1024)
    id: string;

    @ApiProperty({ required: true })
    @IsString()
    @Length(1, 1024)
    name: string;
}
