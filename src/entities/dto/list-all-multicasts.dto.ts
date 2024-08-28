import { ApiProperty } from "@nestjs/swagger";

import { ListAllEntitiesDto } from "./list-all-entities.dto";

export class ListAllMulticastsDto extends ListAllEntitiesDto {
    @ApiProperty({
        type: Number,
        required: false,
        description: "Limit the results to the multicasts associated with a single application",
    })
    applicationId?: number;
}
