import { DbBaseEntity } from "@entities/base.entity";

export class SearchResultDto {
    id: number | string;

    createdAt: Date;

    updatedAt: Date;

    name: string;

    type: SearchResultType;

    applicationId?: number;

    constructor(
        name: string,
        id: number | string,
        createdAt: Date,
        updatedAt: Date,
        type?: SearchResultType
    ) {
        this.name = name;
        this.type = type;
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

export enum SearchResultType {
    Gateway = "Gateway",
    IoTDevice = "IoTDevice",
    Application = "Application",
}
