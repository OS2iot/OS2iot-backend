import {
    Injectable,
    CanActivate,
    ExecutionContext,
    Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthenticatedUser } from "../auth/authenticated-user";
import { PermissionType } from "@enum/permission-type.enum";
import { has } from "lodash";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    private readonly logger = new Logger(RolesGuard.name);

    canActivate(context: ExecutionContext): boolean {
        const roleRequired = this.reflector.get<string>(
            "roles",
            context.getHandler()
        );
        if (!roleRequired) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;
        this.logger.log(`User: ${JSON.stringify(user)}`);

        // Does this user have access to this endpoint?

        return this.hasAccess(user, roleRequired);
    }

    hasAccess(user: AuthenticatedUser, roleRequired: string): boolean {
        if (this.hasGlobalAdminAccess(user)) {
            return true;
        } else if (roleRequired == PermissionType.OrganizationAdmin) {
            return this.hasOrganizationAdminAccess(user);
        } else if (roleRequired == PermissionType.Write) {
            return (
                this.hasOrganizationAdminAccess(user) ||
                this.hasWriteAccess(user)
            );
        } else if (roleRequired == PermissionType.Read) {
            return (
                this.hasOrganizationAdminAccess(user) ||
                this.hasWriteAccess(user) ||
                this.hasReadAccess(user)
            );
        }

        return false;
    }

    hasGlobalAdminAccess(user: AuthenticatedUser): boolean {
        return this.hasSomeAccess(user.permissions.globalAdminPermissions);
    }

    hasOrganizationAdminAccess(user: AuthenticatedUser): boolean {
        return this.hasSomeAccess(
            user.permissions.organizationAdminPermissions
        );
    }

    hasWriteAccess(user: AuthenticatedUser): boolean {
        return this.hasSomeAccess(user.permissions.writePermissions);
    }

    hasReadAccess(user: AuthenticatedUser): boolean {
        return this.hasSomeAccess(user.permissions.readPermissions);
    }

    hasSomeAccess(userPermission: Map<number, number[]>): boolean {
        return userPermission.size > 0;
    }
}
