import { User } from '@entities/user.entity';
import { nameof } from "@helpers/type-helper";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToOne, Unique } from "typeorm";
import { ApiKeyPermission } from "./api-key-permission.entity";
import { DbBaseEntity } from "./base.entity";

@Entity("api_key")
@Unique([nameof<ApiKey>("key")])
export class ApiKey extends DbBaseEntity {
    @Column()
    key: string;

    @Column()
    name: string;

    @ManyToMany(_ => ApiKeyPermission, apiKeyPm => apiKeyPm.apiKeys)
    @JoinTable()
    permissions: ApiKeyPermission[];
	
	@OneToOne(type => User, u => u.apiKeyRef, {
        nullable: false,
        cascade: true,
    })
	@JoinColumn()
	systemUser: User;
}
