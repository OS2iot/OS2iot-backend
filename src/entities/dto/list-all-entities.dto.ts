import { ApiProperty } from "@nestjs/swagger";
import { Application } from "@entities/applikation.entity";

export class ListAllEntitiesDto {
    @ApiProperty({ type: Number, required: false })
    limit? = 100;
    @ApiProperty({ type: Number, required: false })
    offset? = 0;
    @ApiProperty({ type: String, required: false, examples: ["DESC", "ASC"] })
    sort?: "ASC" | "DESC";
    @ApiProperty({ type: String, required: false })
    orderOn?: "id" | "name" | "createdAt" | "updatedAt";
}
