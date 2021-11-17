import { PartialType } from "@nestjs/mapped-types";
import { CreateMulticastDto } from "./create-multicast.dto";

export class UpdateMulticastDto extends PartialType(CreateMulticastDto) {}
