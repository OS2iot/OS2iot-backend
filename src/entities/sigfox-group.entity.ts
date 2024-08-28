import { Column, Entity, ManyToOne, Unique } from "typeorm";

import { DbBaseEntity } from "@entities/base.entity";
import { Organization } from "@entities/organization.entity";
import { SigFoxApiGroupsContent } from "@dto/sigfox/external/sigfox-api-groups-response.dto";

@Entity("sigfox_group")
@Unique(["username", "belongsTo"])
export class SigFoxGroup extends DbBaseEntity {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne(type => Organization, organization => organization.sigfoxGroups, {
    onDelete: "CASCADE",
  })
  belongsTo: Organization;

  @Column({ nullable: false })
  username: string;

  @Column({ nullable: false, select: false })
  password: string;

  @Column({ nullable: false, default: "" })
  sigfoxGroupId: string;

  sigfoxGroupData?: SigFoxApiGroupsContent;
}
