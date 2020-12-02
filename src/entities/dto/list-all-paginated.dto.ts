import { ApiProperty } from "@nestjs/swagger";

export class ListAllPaginated {
    @ApiProperty({ type: Number, required: false })
    limit? = 100;
    @ApiProperty({ type: Number, required: false })
    offset? = 0;
}
