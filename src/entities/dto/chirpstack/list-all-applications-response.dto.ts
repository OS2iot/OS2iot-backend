import { ChirpstackApplicationResponseDto } from "./chirpstack-application-response.dto";

export class ListAllChirpstackApplicationsResponseDto {
  resultList: ChirpstackApplicationResponseDto[];
  totalCount: number;
}
