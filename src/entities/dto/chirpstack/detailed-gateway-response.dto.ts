import { GatewayResponseGrpcDto } from "@dto/chirpstack/gateway-response.dto";
import { Type } from "class-transformer";

export class DetailedGatewayResponseDto extends GatewayResponseGrpcDto {
    discoveryEnabled?: boolean;
    gatewayProfileID?: string;
    boards?: any[];
    metadata?: JSON;
    @Type(() => Array<[string, string]>)
    tagsMap: Array<[string, string]>;
}
