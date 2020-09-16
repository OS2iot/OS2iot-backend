import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsNumber } from "class-validator";

export class CreatePayloadDecoderDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @ApiProperty({
        required: true,
        description:
            "the decoding function must be encoded using JSON.stringify",
    })
    @IsString()
    decodingFunction: string;

    @ApiProperty({ required: true })
    organizationId: number;
}
