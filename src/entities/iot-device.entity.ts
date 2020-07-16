import { Column, ManyToOne,OneToMany, Entity, TableInheritance } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";
import { Application } from "@entities/applikation.entity";
import { Length } from "class-validator";
import { Point } from "geojson";
import { IoTDeviceType } from "@enum/device-type.enum";


@Entity("iot_device")
@TableInheritance({
    column: { type: "enum", name: "type", enum: IoTDeviceType },
})
export abstract class IoTDevice extends DbBaseEntity {
    @Column()
    name: string;
    
    @Column({
        type: "geometry",
        nullable: true,
        spatialFeatureType: "Point",
        srid: 4326,
    })
    location?: Point;

    @Column({ nullable: true })
    @Length(0, 1024)
    commentOnLocation?: string;

    @Column({ nullable: true })
    @Length(0, 1024)
    comment?: string;

    @Column("enum", {
        enum: IoTDeviceType,
    })
    type: IoTDeviceType;

    toString(): string {
        return `IoTDevices: id: ${this.id} - name: ${this.name}`;
    }
}
