import { Organization } from "@entities/organization.entity";
import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize } from "class-validator";

export class UpdateUserOrgsDto {
    @ApiProperty({ required: true })
    @ArrayMinSize(1)
    requestedOrganizations: Organization[];
}
