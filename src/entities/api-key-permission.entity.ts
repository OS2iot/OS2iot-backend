// The order of these imports matters! The extended class has to stay at the bottom for avoiding class extends failure.
import { ApiKey } from "./api-key.entity";
import { ChildEntity, ManyToMany } from "typeorm";
import { PermissionType } from "@enum/permission-type.enum";
import { Permission } from "@entities/permission.entity";

@ChildEntity(PermissionType.ApiKeyPermission)
export abstract class ApiKeyPermission extends Permission {
    @ManyToMany(_ => ApiKey, key => key.permissions, { onDelete: "CASCADE" })
    apiKeys: ApiKey[];

}
