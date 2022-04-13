import { nameof } from "@helpers/type-helper";
import { Column, CreateDateColumn, Entity, Unique } from "typeorm";
import { DbBaseEntity } from "./base.entity";

@Entity("gateway_online_history")
@Unique([nameof<GatewayOnlineHistory>("mac"), nameof<GatewayOnlineHistory>("timestamp")])
export class GatewayOnlineHistory extends DbBaseEntity {
    @Column()
    mac: string;

    @Column()
    wasOnline: boolean;

    @CreateDateColumn()
    timestamp: Date;
}
