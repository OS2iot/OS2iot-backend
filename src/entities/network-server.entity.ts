import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "@entities/base.entity";

@Entity("networkServer")
export class NetworkServer extends DbBaseEntity {
    @Column()
    description: string;

    @Column()
    name: string;

    @Column()
    server: string;

    @Column()
    caCert?: string;

    @Column()
    gatewayDiscoveryDR?: number;

    @Column()
    gatewayDiscoveryEnabled?: boolean;

    @Column()
    gatewayDiscoveryInterval?: number;
    @Column()
    gatewayDiscoveryTXFrequency?: number;

    @Column()
    routingProfileCACert?: string;

    @Column()
    routingProfileTLSCert?: string;

    @Column()
    routingProfileTLSKey?: string;

    @Column()
    tlsCert?: string;

    @Column()
    tlsKey?: string;
}
