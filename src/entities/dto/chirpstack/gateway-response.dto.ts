import { Location } from "@chirpstack/chirpstack-api/common/common_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

export class GatewayResponseGrpcDto {
    id: number;
    gatewayId: string;
    name: string;
    description?: string;
    rxPacketsReceived: number;
    txPacketsEmitted: number;
    organizationId: number;
    organizationName: string;
    location?: Location.AsObject;
    createdAt?: Timestamp.AsObject;
    updatedAt?: Timestamp.AsObject;
    lastSeenAt?: Timestamp.AsObject;
    internalOrganizationId?: number;
    updatedBy?: number;
    createdBy?: number;
}
