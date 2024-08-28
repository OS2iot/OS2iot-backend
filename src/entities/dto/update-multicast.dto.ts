import { PartialType } from "@nestjs/mapped-types";
import { CreateMulticastDto } from "./create-multicast.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateMulticastDto extends PartialType(CreateMulticastDto) {
  @ApiProperty({ required: false })
  id: string;
}
