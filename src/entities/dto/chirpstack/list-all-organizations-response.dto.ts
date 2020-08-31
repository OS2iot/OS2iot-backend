import { OrganizationDto } from "./organization.dto";

export class ListAllOrganizationsReponseDto {
    totalCount: number;

    result: OrganizationDto[];
}
