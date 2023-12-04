import { DbBaseEntity } from "@entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Organization } from "@entities/organization.entity";
import { Point } from "geojson";

@Entity("gateway")
export class Gateway extends DbBaseEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column()
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
}
