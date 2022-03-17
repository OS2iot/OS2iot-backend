import { ApplicationDeviceTypeUnion } from "@enum/device-type.enum";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Application } from "./application.entity";
import { DbBaseEntity } from "./base.entity";

@Entity("application_device_type")
export class ApplicationDeviceType extends DbBaseEntity {
    @Column()
    type: ApplicationDeviceTypeUnion;

    @ManyToOne(() => Application, application => application.deviceTypes, {
        onDelete: "CASCADE",
        // Delete the row instead of null'ing application. Useful for updates
        orphanedRowAction: "delete",
    })
    application: Application;
}
