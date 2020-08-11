import { ChirpstackErrorResponseDto } from "./chirpstack-error-response.dto";

export class ChirpstackReponseStatus {
    success: boolean;
    chirpstackError?: ChirpstackErrorResponseDto;
}
