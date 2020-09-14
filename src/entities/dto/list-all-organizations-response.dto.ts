import { ListAllEntitiesResponseDto } from "./list-all-entities-reponse.dto";
import { Organization } from "@entities/organization.entity";

export class ListAllOrganizationsReponseDto extends ListAllEntitiesResponseDto<
    Organization
> {}
