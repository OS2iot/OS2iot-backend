import { Organization } from "@entities/organization.entity";

export class ListAllOrganizationsReponseDto {
    totalCount: number;

    result: Organization[];
}
