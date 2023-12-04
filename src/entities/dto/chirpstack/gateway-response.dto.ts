import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";

export class GatewayResponseDto {
    id: number;
    gatewayId: string;
    name: string;
    description?: string;
    rxPacketsReceived: number;
    txPacketsEmitted: number;
    organizationId: number;
    organizationName: string;
    location: CommonLocationDto;
    tags: { [id: string]: string | number };
    createdAt?: Date;
    updatedAt?: Date;
    lastSeenAt?: Date;
    updatedBy?: number;
    createdBy?: number;
}
