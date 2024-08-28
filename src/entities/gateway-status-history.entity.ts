import { nameof } from "@helpers/type-helper";
import { Column, CreateDateColumn, Entity, Unique } from "typeorm";
import { DbBaseEntity } from "./base.entity";

@Entity("gateway_status_history")
@Unique([nameof<GatewayStatusHistory>("mac"), nameof<GatewayStatusHistory>("timestamp")])
export class GatewayStatusHistory extends DbBaseEntity {
  @Column()
  mac: string;

  @Column()
  wasOnline: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
