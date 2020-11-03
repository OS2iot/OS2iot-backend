import { ChirpstackApplicationResponseDto } from "./chirpstack-application-response.dto";

export class ListAllChirpstackApplicationsResponseDto {
    result: ChirpstackApplicationResponseDto[];
    totalCount: number;
}
