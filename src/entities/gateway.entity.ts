import { DbBaseEntity } from "@entities/base.entity";
import { Organization } from "@entities/organization.entity";
import { GatewayPlacement, GatewayStatus } from "@enum/gateway.enum";
import { Length } from "class-validator";
import { Point } from "geojson";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity("gateway")
export class Gateway extends DbBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    transformer: {
      to: (value: string) => value.toLowerCase(),
      from: (value: string) => value.toLowerCase(),
    },
  })
  @Length(16, 16, { message: "Must be 16 characters" })
  gatewayId: string;

  @ManyToOne(_ => Organization, organization => organization.gateways, { onDelete: "CASCADE" })
  organization: Organization;

  @Column()
  rxPacketsReceived: number;

  @Column()
  txPacketsEmitted: number;

  @Column()
  tags: string;

  @Column({
    type: "geometry",
    nullable: true,
    spatialFeatureType: "Point",
    srid: 4326,
  })
  location?: Point;

  @Column({ type: "decimal", nullable: true })
  altitude?: number;

  @Column({ nullable: true })
  lastSeenAt?: Date;

  @Column("enum", { nullable: true, enum: GatewayPlacement })
  placement?: GatewayPlacement;

  @Column({ nullable: true })
  modelName?: string;

  @Column({ nullable: true })
  antennaType?: string;

  @Column("enum", { nullable: true, enum: GatewayStatus })
  status?: GatewayStatus;

  @Column({ nullable: true })
  gatewayResponsibleName?: string;

  @Column({ nullable: true })
  gatewayResponsibleEmail?: string;

  @Column({ nullable: true })
  gatewayResponsiblePhoneNumber?: string;

  @Column({ nullable: true })
  operationalResponsibleName?: string;

  @Column({ nullable: true })
  operationalResponsibleEmail?: string;
  @Column({ nullable: true })
  notifyOffline?: boolean;
  @Column({ nullable: true })
  notifyUnusualPackages?: boolean;
  @Column({ nullable: true })
  offlineAlarmThresholdMinutes?: number;
  @Column({ nullable: true })
  minimumPackages?: number;
  @Column({ nullable: true })
  maximumPackages?: number;
  @Column({ nullable: true })
  alarmMail?: string;
  @Column({ nullable: true })
  hasSentOfflineNotification?: boolean;
}
