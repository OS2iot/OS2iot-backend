import { Organization } from "@entities/organization.entity";

import { ListAllEntitiesResponseDto } from "./list-all-entities-response.dto";

export class ListAllOrganizationsResponseDto extends ListAllEntitiesResponseDto<
    Organization
> {}
