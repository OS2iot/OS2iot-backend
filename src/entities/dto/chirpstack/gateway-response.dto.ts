import { Location } from "@chirpstack/chirpstack-api/common/common_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { CommonLocationDto } from "./common-location.dto";

export class GatewayResponseGrpcDto {
    id: number;
    gatewayId: string;
    name: string;
    description?: string;
    rxPacketsReceived: number;
    txPacketsEmitted: number;
    organizationId: number;
    organizationName: string;
    location: CommonLocationDto;
    createdAt?: Timestamp.AsObject;
    updatedAt?: Timestamp.AsObject;
    lastSeenAt?: Timestamp.AsObject;
    internalOrganizationId?: number;
    updatedBy?: number;
    createdBy?: number;
    tags: { [id: string]: string };
}
