import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";

export class GatewayResponseDto {
    id: string;
    name: string;
    description: string;
    organizationID: string;
    networkServerID: string;
    location: CommonLocationDto;
    tags: { [id: string]: string | number };
    tagsString: string;

    networkServerName?: string;
    createdAt?: string;
    updatedAt?: string;
    firstSeenAt?: string;
    lastSeenAt?: string;
}
