import { Column, Entity, ManyToMany, OneToMany, Unique } from "typeorm";

import { Application } from "@entities/application.entity";
import { DbBaseEntity } from "@entities/base.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { Permission } from "@entities/permissions/permission.entity";

import { SigFoxGroup } from "./sigfox-group.entity";
import { DeviceModel } from "./device-model.entity";
import { User } from "./user.entity";
import { Gateway } from "@entities/gateway.entity";

@Entity("organization")
@Unique(["name"])
export class Organization extends DbBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ default: false })
  openDataDkRegistered: boolean;

  @OneToMany(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => Application,
    application => application.belongsTo,
    { onDelete: "CASCADE" }
  )
  applications: Application[];

  @OneToMany(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => Permission,
    permission => permission.organization,
    { onDelete: "CASCADE" }
  )
  permissions: Permission[];

  @OneToMany(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => PayloadDecoder,
    payloadDecoder => payloadDecoder.organization,
    { onDelete: "CASCADE", nullable: true }
  )
  payloadDecoders?: PayloadDecoder[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany(type => SigFoxGroup, sigfoxGroup => sigfoxGroup.belongsTo, {
    onDelete: "CASCADE",
    nullable: true,
  })
  sigfoxGroups: SigFoxGroup[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany(type => DeviceModel, deviceModel => deviceModel.belongsTo, {
    onDelete: "CASCADE",
    nullable: true,
  })
  deviceModels?: DeviceModel[];

  @ManyToMany(_ => User, user => user.requestedOrganizations, {
    nullable: true,
  })
  awaitingUsers?: User[];

  @OneToMany(_ => Gateway, gateway => gateway.organization, { nullable: true })
  gateways?: Gateway[];
}
