import { ServiceProfileDto } from "./service-profile.dto";

export class ListAllServiceProfilesResponseDto {
    result: ServiceProfileDto[];
    totalCount: string;
}
