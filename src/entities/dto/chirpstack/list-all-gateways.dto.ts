import { ApiProperty, OmitType, PickType } from "@nestjs/swagger";
import { ChirpstackPaginatedListDto } from "./chirpstack-paginated-list.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { IsSwaggerOptional } from "@helpers/optional-validator";
import { NullableStringToNumber, StringToNumber } from "@helpers/string-to-number-validator";
import { IsNumber, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { DefaultLimit, DefaultOffset } from "@config/constants/pagination-constants";

export class ListAllGatewaysDto extends OmitType(ListAllEntitiesDto, ["limit", "offset"]) {
    @IsSwaggerOptional({ description: "Filter to one organization" })
    @StringToNumber()
    organizationId?: number;

    @ApiProperty({ type: Number, required: false })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => NullableStringToNumber(value))
    limit? = DefaultLimit;

    @ApiProperty({ type: Number, required: false })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => NullableStringToNumber(value))
    offset? = DefaultOffset;
}
