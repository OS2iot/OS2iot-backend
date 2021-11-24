import { nameof } from "@helpers/type-helper";
import { Column, Entity, Unique } from "typeorm";
import { DbBaseEntity } from "./base.entity";

@Entity("api_key")
@Unique([nameof<ApiKey>("keyHash")])
export class ApiKey extends DbBaseEntity {
    @Column()
    keyHash: string;

    // TODO: Permissions
}
