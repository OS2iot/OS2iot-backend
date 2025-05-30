import { User } from "@entities/user.entity";
import { nameof } from "@helpers/type-helper";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToOne, Unique } from "typeorm";
import { DbBaseEntity } from "./base.entity";
import { Permission } from "./permissions/permission.entity";

@Entity("api_key")
@Unique([nameof<ApiKey>("key")])
export class ApiKey extends DbBaseEntity {
  @Column()
  key: string;

  @Column()
  name: string;

  @ManyToMany(_ => Permission, apiKeyPm => apiKeyPm.apiKeys)
  @JoinTable()
  permissions: Permission[];

  @OneToOne(() => User, u => u.apiKeyRef, {
    nullable: false,
    cascade: true,
  })
  @JoinColumn()
  systemUser: User;

  @Column({ nullable: true })
  expiresOn?: Date;
}
