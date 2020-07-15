import { ApiProperty } from "@nestjs/swagger";

export class ListAllEntities {
    @ApiProperty({ type: Number, required: true })
    limit? = 100;
    @ApiProperty({ type: Number, required: true })
    offset? = 0;
    @ApiProperty({ type: String, required: true })
    sort?= "DESC";
    @ApiProperty({ type: String, required: true })
    orderOn? = "id";

}
