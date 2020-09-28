import { Organization } from "@entities/organization.entity";

import { ListAllEntitiesResponseDto } from "./list-all-entities-reponse.dto";

export class ListAllOrganizationsReponseDto extends ListAllEntitiesResponseDto<
    Organization
> {}
