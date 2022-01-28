import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ChirpstackPaginatedListDto {
    @ApiProperty({ type: Number, required: false })
    @IsOptional()
    limit? = 100;
    @ApiProperty({ type: Number, required: false })
    @IsOptional()
    offset? = 0;
    @ApiProperty({ type: Number, required: false })
    @IsOptional()
    organizationId?: number;
}
