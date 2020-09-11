import { UserPermissions } from "@dto/permission-organization-application.dto";

export class AuthenticatedUser {
    userId: number;
    username: string;
    permissions: UserPermissions;
}
