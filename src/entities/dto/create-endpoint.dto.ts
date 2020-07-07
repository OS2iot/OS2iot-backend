import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateEndpointDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    apiKey: string;

    @ApiProperty({ required: true })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    endpointUrl: [string];
}
