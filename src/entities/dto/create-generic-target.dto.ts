import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateGenericTargetDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    targetName: string;

    @ApiProperty({ required: true })
    @IsOptional()
    applicationId: number;

    @ApiProperty({ required: true })
    @IsOptional()
    @IsString()
    @MaxLength(1024,{each:true})
    devices: string;
}
