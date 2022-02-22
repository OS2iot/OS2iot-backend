import { StringToNumber } from "@helpers/string-to-number-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListAllEntitiesDto {
    @ApiProperty({ type: Number, required: false })
    @IsOptional()
    @StringToNumber()
    limit? = 100;
    @ApiProperty({ type: Number, required: false })
    @IsOptional()
    @StringToNumber()
    offset? = 0;
    @ApiProperty({ type: String, required: false })
    @IsOptional()
    @IsString()
    sort?: "ASC" | "DESC";
    @ApiProperty({ type: String, required: false })
    @IsOptional()
    @IsString()
    orderOn?:
        | "id"
        | "name"
        | "createdAt"
        | "updatedAt"
        | "lastLogin"
        | "type"
        | "organisations"
        | "active"
        | "groupName";
}
