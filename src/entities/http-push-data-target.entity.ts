import { Column, ChildEntity, BeforeInsert } from "typeorm";
import { DataTarget } from "@entities/data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";

@ChildEntity(DataTargetType.HttpPush)
export class HttpPushDataTarget extends DataTarget {
    @Column()
    url: string;

    @Column({ default: 30000, comment: "HTTP call timeout in milliseconds" })
    timeout: number;

    @Column({ nullable: true })
    authorizationHeader?: string;

    @BeforeInsert()
    private beforeInsert() {
        /**
         * Generate uuid (version 4 = random) to be used as the apiKey for this GenericHTTPDevice
         */
        this.type = DataTargetType.HttpPush;
    }
}
