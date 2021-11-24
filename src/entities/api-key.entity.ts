import { nameof } from "@helpers/type-helper";
import { Column, Entity, Unique } from "typeorm";
import { DbBaseEntity } from "./base.entity";

@Entity("api_key")
@Unique([nameof<ApiKey>("key")])
export class ApiKey extends DbBaseEntity {
    @Column()
    key: string;

    // TODO: Permissions. I.e. which user group is it tied to and what the permission type is
    // User groups are stored in the "permissions" table. I think. don't ask why..
}
