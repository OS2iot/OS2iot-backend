import { PermissionType } from "@enum/permission-type.enum";
import { ChildEntity, ManyToMany } from "typeorm";
import { ApiKey } from "./api-key.entity";
import { Permission } from "./permissions/permission.entity";

@ChildEntity(PermissionType.ApiKeyPermission)
export abstract class ApiKeyPermission extends Permission {
    @ManyToMany(_ => ApiKey, key => key.permissions, { onDelete: "CASCADE" })
    apiKeys: ApiKey[];
}
