import { Entity, TableInheritance, Column, ManyToOne } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { Application } from "@entities/application.entity";

@Entity("data_target")
@TableInheritance({
    column: { type: "enum", name: "type", enum: DataTargetType },
})
export abstract class DataTarget extends DbBaseEntity {
    @Column("enum", {
        enum: DataTargetType,
    })
    type: DataTargetType;

    @Column()
    name: string;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Application,
        application => application.iotDevices,
        { onDelete: "CASCADE" }
    )
    application: Application;
}
