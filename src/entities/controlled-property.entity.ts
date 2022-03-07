import { ControlledPropertyTypes } from "@enum/controlled-property.enum";
import { Column, Entity, ManyToOne } from "typeorm";
import { Application } from "./application.entity";
import { DbBaseEntity } from "./base.entity";

@Entity("controlled_property")
export class ControlledProperty extends DbBaseEntity {
    @Column()
    type: ControlledPropertyTypes;

    @ManyToOne(() => Application, application => application.controlledProperties, {
        onDelete: "CASCADE",
        // Delete the row instead of null'ing application. Useful for updates
        orphanedRowAction: "delete",
    })
    application: Application;
}
