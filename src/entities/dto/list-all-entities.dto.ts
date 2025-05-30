import { DefaultLimit, DefaultOffset } from "@config/constants/pagination-constants";
import { StringToNumber } from "@helpers/string-to-number-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListAllEntitiesDto {
  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @StringToNumber()
  limit? = DefaultLimit;
  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @StringToNumber()
  offset? = DefaultOffset;
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
    | "groupName"
    | "rssi"
    | "snr"
    | "status"
    | "startDate"
    | "endDate"
    | "owner"
    | "contactPerson"
    | "personalData"
    | "openDataDkEnabled"
    | "deviceModel"
    | "devices"
    | "dataTargets"
    | "organizationName"
    | "commentOnLocation"
    | "statusCheck"
    | "expiresOn";
}
