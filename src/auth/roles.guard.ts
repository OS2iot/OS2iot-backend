import { Injectable, CanActivate, ExecutionContext, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionType } from "@enum/permission-type.enum";
import { AuthenticatedUser } from "@dto/internal/authenticated-user";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    private readonly logger = new Logger(RolesGuard.name);

    canActivate(context: ExecutionContext): boolean {
        const roleRequired = this.reflector.get<string>("roles", context.getHandler());
        if (!roleRequired) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;
        this.logger.log(`User: ${JSON.stringify(user)}`);
        return this.hasAccess(user, roleRequired);
    }

    hasAccess(user: AuthenticatedUser, roleRequired: string): boolean {
        if (user.permissions.isGlobalAdmin) {
            return true;
        } else if (roleRequired == PermissionType.OrganizationAdmin) {
            return this.hasOrganizationAdminAccess(user);
        } else if (roleRequired == PermissionType.Write) {
            return this.hasOrganizationAdminAccess(user) || this.hasWriteAccess(user);
        } else if (roleRequired == PermissionType.Read) {
            return (
                this.hasOrganizationAdminAccess(user) ||
                this.hasWriteAccess(user) ||
                this.hasReadAccess(user)
            );
        }

        return false;
    }

    hasOrganizationAdminAccess(user: AuthenticatedUser): boolean {
        return user.permissions.organizationAdminPermissions.size > 0;
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
