import { Column, ChildEntity, BeforeInsert } from "typeorm";
import { DataTarget } from "@entities/data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { HttpPushDataTargetConfiguration } from "./interfaces/http-push-data-target-configuration.interface";
import { AuthorizationType } from "@enum/authorization-type.enum";

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

    toConfiguration(): HttpPushDataTargetConfiguration {
        return {
            url: this.url,
            timeout: this.timeout,
            authorizationType:
                this.authorizationHeader != ""
                    ? AuthorizationType.HEADER_BASED_AUTHORIZATION
                    : AuthorizationType.NO_AUTHORIZATION,
            authorizationHeader: this.authorizationHeader,
        };
    }
}
