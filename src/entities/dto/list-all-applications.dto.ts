import { DefaultLimit, DefaultOffset } from "@config/constants/pagination-constants";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { IsSwaggerOptional } from "@helpers/optional-validator";
import { NullableStringToNumber, StringToNumber } from "@helpers/string-to-number-validator";
import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsNumber } from "class-validator";

export class ListAllApplicationsDto extends OmitType(ListAllEntitiesDto, ["limit", "offset"]) {
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
