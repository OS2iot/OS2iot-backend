import { ChirpstackApplicationResponseDto } from "./chirpstack-application-response.dto";

export class ListAllChirpstackApplicationsReponseDto {
    result: ChirpstackApplicationResponseDto[];
    totalCount: number;
}
