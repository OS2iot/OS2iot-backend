import { Column, Entity, ManyToOne } from "typeorm";
import { Application } from "./application.entity";
import { DbBaseEntity } from "./base.entity";

@Entity("contact_person")
export class ContactPerson extends DbBaseEntity {
  @Column({nullable: true})
  role: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @ManyToOne(() => Application, application => application.contactPersons, {
    onDelete: "CASCADE",
    // Delete the row instead of null'ing application. Useful for updates
    orphanedRowAction: "delete",
  })
  application: Application;
}
