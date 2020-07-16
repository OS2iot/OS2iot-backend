import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional, IsNumber } from "class-validator";
import { CreateDataTargetDto } from "./create-data-target.dto";

export class CreateHttpPushTargetDto extends CreateDataTargetDto {
    @ApiProperty()
    @IsString()
    @MinLength(1)
    @MaxLength(1024)
    targetUrl: string;

    @ApiProperty({ required: true })
    timeout: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    authorizationHeader: string;
}
