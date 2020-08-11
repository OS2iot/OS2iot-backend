import { ApiProperty } from "@nestjs/swagger";

export class ChirpstackPaginatedListDto {
    @ApiProperty({ type: Number, required: false })
    limit? = 100;
    @ApiProperty({ type: Number, required: false })
    offset? = 0;
}
