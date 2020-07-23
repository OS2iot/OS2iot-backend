import { ApiProperty } from "@nestjs/swagger";
import { Application } from "@entities/application.entity";

export class ListAllEntitiesDto {
    @ApiProperty({ type: Number, required: false })
    limit? = 100;
    @ApiProperty({ type: Number, required: false })
    offset? = 0;
    @ApiProperty({ type: String, required: false })
    sort?: "ASC" | "DESC";
    @ApiProperty({ type: String, required: false })
    orderOn?: "id" | "name" | "createdAt" | "updatedAt";
}
