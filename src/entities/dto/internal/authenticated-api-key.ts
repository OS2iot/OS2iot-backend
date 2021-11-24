import { UserPermissions } from "@dto/permission-organization-application.dto";

export class AuthenticatedApiKey {
    // TODO: User id and user name doesn't make sense for API key
    userId: number;
    username: string;
    permissions?: UserPermissions;
    // nameID?: string;
    // nameIDFormat?: string;
}
