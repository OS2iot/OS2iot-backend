import { LocationSourceMap } from "@chirpstack/chirpstack-api/common/common_pb";
import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Max, Min } from "class-validator";

export class CommonLocationDto {
  @ApiProperty({ required: true })
  @Max(180.0)
  @Min(-180.0)
  longitude: number;

  @ApiProperty({ required: true })
  @Max(90.0)
  @Min(-90.0)
  latitude: number;

  @ApiProperty({ required: false })
  @IsOptional()
  altitude?: number;

  @ApiHideProperty()
  source?: LocationSourceMap[keyof LocationSourceMap];

  @ApiProperty({ required: false })
  @IsOptional()
  accuracy?: number;
}
