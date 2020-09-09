import { PermissionMinimalDto } from "../entities/dto/permission-minimal.dto";
import { UserPermissions } from "@dto/permission-organization-application.dto";

export class AuthenticatedUser {
    userId: number;
    username: string;
    permissions: UserPermissions;
}
