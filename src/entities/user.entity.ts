import { ApiKey } from "@entities/api-key.entity";
import { DbBaseEntity } from "@entities/base.entity";
import { Permission } from "@entities/permissions/permission.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToOne, Unique } from "typeorm";
import { Organization } from "./organization.entity";

@Entity("user")
@Unique(["email"])
export class User extends DbBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ select: false, nullable: true })
  passwordHash: string;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  lastLogin?: Date;

  @Column({ nullable: true })
  nameId: string;

  @Column({ nullable: true })
  awaitingConfirmation: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToMany(type => Permission, permission => permission.users)
  @JoinTable()
  permissions: Permission[];

  @ManyToMany(_ => Organization, requestedOrganizations => requestedOrganizations.awaitingUsers, {
    nullable: true,
  })
  @JoinTable()
  requestedOrganizations: Organization[];

  @OneToOne(type => ApiKey, a => a.systemUser, {
    nullable: true,
    cascade: false,
  })
  apiKeyRef: ApiKey;

  @Column({ default: false })
  isSystemUser: boolean;

  @Column({ default: false })
  showWelcomeScreen: boolean;

  @Column({ nullable: true })
  expiresOn?: Date;
}
