import { UserPermissions } from "@dto/permission-organization-application.dto";

export class AuthenticatedApiKey {
    // TODO: User id and user name doesn't make sense for API key. But it's expected almost everywhere
    userId: number;
    username: string;
    permissions?: UserPermissions;
    fooApiField: string;
}
