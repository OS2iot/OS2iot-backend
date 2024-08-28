import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class ChirpstackBoardsDto {
  @ApiProperty({ required: false })
  @IsString()
  @Matches(/[0-9A-Fa-f]{32}/)
  fineTimestampKey: string;

  @ApiProperty({ required: false })
  @IsString()
  @Matches(/[0-9A-Fa-f]{16}/)
  fpgaID: string;
}
