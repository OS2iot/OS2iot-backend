import { DataTarget } from "@entities/data-target.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { Organization } from "@entities/organization.entity";
import { ApplicationStatus } from "@enum/application-status.enum";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  RelationId,
  Unique,
} from "typeorm";
import { ApplicationDeviceType } from "./application-device-type.entity";
import { ControlledProperty } from "./controlled-property.entity";
import { Multicast } from "./multicast.entity";
import { Permission } from "./permissions/permission.entity";
import { DbBaseEntity } from "@entities/base.entity";
import { nameof } from "@helpers/type-helper";

@Entity("application")
@Unique(["name"])
export class Application extends DbBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => IoTDevice,
    iotdevice => iotdevice.application,
    { onDelete: "CASCADE" }
  )
  iotDevices: IoTDevice[];

  @OneToMany(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => DataTarget,
    datatarget => datatarget.application,
    { onDelete: "CASCADE" }
  )
  dataTargets: DataTarget[];

  @OneToMany(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => Multicast,
    multicasts => multicasts.application,
    { onDelete: "CASCADE" }
  )
  multicasts: Multicast[];

  @ManyToOne(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => Organization,
    organization => organization.applications,
    { onDelete: "CASCADE" }
  )
  belongsTo: Organization;

  @ManyToMany(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type => Permission,
    permission => permission.applications
  )
  @JoinTable()
  permissions: Permission[];

  @RelationId(nameof<Application>("permissions"))
  permissionIds: Permission["id"][];

  @Column({ nullable: true })
  status?: ApplicationStatus;

  @CreateDateColumn({ nullable: true })
  startDate?: Date;

  @CreateDateColumn({ nullable: true })
  endDate?: Date;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  owner?: string;

  @Column({ nullable: true })
  contactPerson?: string;

  @Column({ nullable: true })
  contactEmail?: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ nullable: true })
  personalData?: boolean;

  @Column({ nullable: true })
  hardware?: string;

  @OneToMany(() => ControlledProperty, entity => entity.application, {
    nullable: true,
    cascade: true,
  })
  controlledProperties?: ControlledProperty[];

  @OneToMany(() => ApplicationDeviceType, entity => entity.application, {
    nullable: true,
    cascade: true,
  })
  deviceTypes?: ApplicationDeviceType[];

  @Column({ nullable: true })
  chirpstackId?: string;
}
