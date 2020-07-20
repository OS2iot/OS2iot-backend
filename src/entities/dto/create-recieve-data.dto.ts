import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional, IsNumber, IsNotEmpty } from "class-validator";

export class CreateRecieveDataDto {
    
    @ApiProperty({ required: false })
    @IsString()
    @IsNotEmpty()
    apiKey: string;

    @ApiProperty({ required: true })
    @MinLength(1)
    @MaxLength(1024)
    data: string;
    
}
