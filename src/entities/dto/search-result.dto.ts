import { DbBaseEntity } from "@entities/base.entity";

export class SearchResultDto {
  id: number | string;

  createdAt: Date;

  updatedAt: Date;

  name: string;

  type: SearchResultType;

  applicationId?: number;
  organizationId?: number;
  organizationName?: string;

  deviceId?: string;
  deviceEUI?: string;
  apiKey?: string;
  gatewayId?: string;
  deviceType?: string;

  constructor(
    name: string,
    id: number | string,
    createdAt: Date,
    updatedAt: Date,
    gatewayId: string,
    type?: SearchResultType
  ) {
    this.name = name;
    this.type = type;
    this.id = id;
    this.gatewayId = gatewayId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export enum SearchResultType {
  Gateway = "Gateway",
  IoTDevice = "IoTDevice",
  Application = "Application",
}
