import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsUrl, MaxLength } from "class-validator";

export class OddkMailInfo {
  @ApiProperty({ required: true })
  @IsNumber()
  organizationId: number;

  @ApiProperty({ required: true })
  @IsString()
  organizationOddkAlias: string;

  @ApiProperty({ required: false })
  comment?: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(1024)
  @IsUrl({
    require_tld: false,
  })
  sharingUrl: string;
}
