import { PickType } from "@nestjs/swagger";
import { ChirpstackPaginatedListDto } from "./chirpstack-paginated-list.dto";

export class ChirpstackGetAll extends PickType(ChirpstackPaginatedListDto, [
    "organizationId",
]) {}
