import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateApplicationDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;
    
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    description?: string;
}
