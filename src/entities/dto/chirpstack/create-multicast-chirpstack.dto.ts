import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { ChirpstackMulticastContentsDto } from "./chirpstack-multicast-contents.dto";

export class CreateMulticastChirpStackDto {
  @ApiProperty({ required: true })
  @ValidateNested({ each: true })
  @Type(() => ChirpstackMulticastContentsDto)
  multicastGroup: ChirpstackMulticastContentsDto;
}
