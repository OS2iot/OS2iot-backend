import { ServiceProfileDto } from "./service-profile.dto";

export class ListAllServiceProfilesReponseDto {
    result: ServiceProfileDto[];
    totalCount: string;
}
