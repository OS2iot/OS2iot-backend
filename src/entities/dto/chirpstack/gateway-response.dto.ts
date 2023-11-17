import { Location } from "@chirpstack/chirpstack-api/common/common_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

export class GatewayResponseGrpcDto {
    gatewayId: string;
    name: string;
    description: string;
    organizationID?: string;
    location?: Location.AsObject;
    createdAt?: Timestamp.AsObject;
    updatedAt?: Timestamp.AsObject;
    lastSeenAt?: Timestamp.AsObject;
    internalOrganizationId?: number;
    updatedBy?: number;
    createdBy?: number;
}
