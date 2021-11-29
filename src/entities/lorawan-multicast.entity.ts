import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { multicastGroup } from "@enum/multicast-type.enum";
import { Multicast } from "./multicast.entity";
import { DbBaseEntity } from "./base.entity";

@Entity("lorawan-multicast")
export class LorawanMulticastDefinition extends DbBaseEntity {
    @Column()
    address: string;

    @Column()
    networkSessionKey: string;

    @Column()
    applicationSessionKey: string;

    @Column()
    frameCounter: number;

    @Column()
    dataRate: number;

    @Column()
    frequency: number;

    @Column()
    groupType: multicastGroup;

    @OneToOne(type => Multicast, multicast => multicast.lorawanMulticastDefinition)
    multicast: Multicast;

    @Column()
    chirpstackGroupId: string;
}
