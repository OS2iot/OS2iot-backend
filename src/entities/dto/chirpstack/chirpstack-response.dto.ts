import { ChirpstackErrorResponseDto } from "./chirpstack-error-response.dto";

export class ChirpstackResponseStatus {
    success: boolean;
    chirpstackError?: ChirpstackErrorResponseDto;
}
