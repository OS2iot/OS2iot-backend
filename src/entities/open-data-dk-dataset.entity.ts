import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { DbBaseEntity } from "./base.entity";
import { DataTarget } from "./data-target.entity";

@Entity("open_data_dk_dataset")
export class OpenDataDkDataset extends DbBaseEntity {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne(type => DataTarget, dt => dt.openDataDkDataset, { onDelete: "CASCADE" })
  @JoinColumn()
  dataTarget: DataTarget;

  @Column()
  name: string;

  @Column({ nullable: false, default: "" })
  description: string;

  @Column("text", { array: true, nullable: true })
  keywords?: string[];

  @Column({ nullable: true })
  keywordTags?: string;

  @Column()
  license: string;

  @Column()
  authorName: string;

  @Column()
  authorEmail: string;

  @Column({ nullable: false, default: "" })
  resourceTitle: string;

  @Column({ nullable: true })
  updateFrequency?: string;

  @Column({ nullable: true })
  documentationUrl?: string;

  @Column({ nullable: false, default: false })
  dataDirectory: boolean;
}
