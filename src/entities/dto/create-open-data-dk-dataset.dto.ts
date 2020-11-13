import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class CreateOpenDataDkDatasetDto {
    @ApiProperty({ required: true })
    @IsString()
    name: string;
    
    @ApiProperty({ required: true })
    @IsString()
    description: string;
    
    @ApiProperty({ required: true })
    @IsString()
    keywords: string[];
    
    @ApiProperty({ required: true })
    @IsString()
    license: string;
    
    @ApiProperty({ required: true })
    @IsString()
    authorName: string;
    
    @ApiProperty({ required: true })
    @IsString()
    @IsEmail()
    authorEmail: string;
    
    @ApiProperty({ required: true })
    @IsString()
    resourceTitle: string;
}
