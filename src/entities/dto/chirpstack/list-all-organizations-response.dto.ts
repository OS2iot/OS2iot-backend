import { Organization } from "@entities/organization.entity";

export class ListAllOrganizationsResponseDto {
    totalCount: number;

    result: Organization[];
}
