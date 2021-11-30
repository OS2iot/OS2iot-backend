import { nameof } from "@helpers/type-helper";
import { Column, Entity, JoinTable, ManyToMany, Unique } from "typeorm";
import { ApiKeyPermission } from "./api-key-permission.entity";
import { DbBaseEntity } from "./base.entity";

@Entity("api_key")
@Unique([nameof<ApiKey>("key")])
export class ApiKey extends DbBaseEntity {
    @Column()
    key: string;

    @Column()
    name: string;

    @ManyToMany(_ => ApiKeyPermission, pm => pm.apiKeys)
    @JoinTable()
    permissions: ApiKeyPermission[];
}
