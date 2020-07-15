import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateDataTargetDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    targetName: string;

    @ApiProperty({ required: false })
    @IsOptional()
    applicationId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    TargetId: number;

}
