import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { CommonLocationDto } from "./common-location.dto";

export class GatewayResponseGrpcDto {
    id?: number;
    gatewayId: string;
    name: string;
    description?: string;
    rxPacketsReceived?: number;
    txPacketsEmitted?: number;
    internalOrganizationId?: number;
    internalOrganizationName?: string;
    location: CommonLocationDto;
    createdAt?: Timestamp.AsObject;
    updatedAt?: Timestamp.AsObject;
    lastSeenAt?: Timestamp.AsObject;
    updatedBy?: number;
    createdBy?: number;
    tags?: { [id: string]: string };
}
