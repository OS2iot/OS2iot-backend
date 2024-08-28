import { PickType } from "@nestjs/swagger";

import { Organization } from "@entities/organization.entity";
import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";

export class ListAllOrganizationsResponseDto extends ListAllEntitiesResponseDto<Organization> {}

export class ListAllMinimalOrganizationsResponseDto extends ListAllEntitiesResponseDto<MinimalOrganization> {}

export class MinimalOrganization extends PickType(Organization, ["id", "name"]) {}
