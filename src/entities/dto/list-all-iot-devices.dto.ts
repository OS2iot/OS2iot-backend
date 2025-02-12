import { ApplicationStatus } from "@enum/application-status.enum";
import { NullableApplicationStatus, NullableString } from "@helpers/string-to-number-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class ListAllIotDevicesDto {
  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => NullableApplicationStatus(value))
  status?: ApplicationStatus | undefined;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => NullableString(value))
  statusCheck?: "stable" | "alert" | null;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => NullableString(value))
  owner?: string | null;
}
