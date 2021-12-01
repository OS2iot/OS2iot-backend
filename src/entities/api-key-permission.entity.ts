import { Permission } from "@entities/permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { ChildEntity, ManyToMany, ManyToOne } from "typeorm";
import { ApiKey } from "./api-key.entity";
import { Organization } from "./organization.entity";

@ChildEntity(PermissionType.ApiKeyPermission)
export abstract class ApiKeyPermission extends Permission {
    @ManyToMany(_ => ApiKey, key => key.permissions, { onDelete: "CASCADE" })
    apiKeys: ApiKey[];

    @ManyToOne(() => Organization, { onDelete: "CASCADE" })
    organization: Organization;
}
