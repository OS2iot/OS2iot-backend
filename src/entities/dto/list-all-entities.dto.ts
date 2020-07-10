import { ApiProperty } from "@nestjs/swagger";

export class ListAllEntities {
    @ApiProperty({ type: Number, required: false })
    limit? = 100;
    @ApiProperty({ type: Number, required: false })
    offset? = 0;
    @ApiProperty({ type: String, required: false })
    sort? = "acd";

}
