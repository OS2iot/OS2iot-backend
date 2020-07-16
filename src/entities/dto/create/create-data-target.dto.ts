import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateDataTargetDto {
    @ApiProperty({ required: true })
    @IsString()
    targetName: string;

    @ApiProperty({ required: false })
    @IsOptional()
    applicationId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    TargetId: number;
}
