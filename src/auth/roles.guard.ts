import { AuthenticatedUser } from "@dto/internal/authenticated-user";
import { PermissionType } from "@enum/permission-type.enum";
import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesMetaData } from "./constants";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    private readonly logger = new Logger(RolesGuard.name);

    canActivate(context: ExecutionContext): boolean {
        const roleRequiredMethod = this.reflector.get<string>(
            RolesMetaData,
            context.getHandler()
        );
        const roleRequiredClass = this.reflector.get<string>(
            RolesMetaData,
            context.getClass()
        );
        const roleRequired = roleRequiredMethod ?? roleRequiredClass;

        if (!roleRequired) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;
        this.logger.verbose(
            JSON.stringify({
                msg: "Authorized user using JWT",
                userId: user.userId,
                userName: user.username,
            })
        );
        return this.hasAccess(user, roleRequired);
    }

    hasAccess(user: AuthenticatedUser, roleRequired: string): boolean {
        if (user.permissions.isGlobalAdmin) {
            return true;
        } else if (roleRequired == PermissionType.OrganizationApplicationAdmin) {
            return this.hasOrganizationApplicationAdminAccess(user);
        } else if (roleRequired == PermissionType.OrganizationUserAdmin) {
            return this.hasOrganizationUserAdminAccess(user);
        } else if (roleRequired == PermissionType.OrganizationGatewayAdmin) {
            return this.hasOrganizationGatewayAdminAccess(user);
        } else if (roleRequired == PermissionType.Read) {
            return (
                this.hasOrganizationApplicationAdminAccess(user) ||
                this.hasOrganizationUserAdminAccess(user) ||
                this.hasOrganizationGatewayAdminAccess(user) ||
                this.hasReadAccess(user)
            );
        }

        return false;
    }

    hasOrganizationApplicationAdminAccess(user: AuthenticatedUser): boolean {
        return user.permissions.orgToApplicationAdminPermissions.size > 0;
    }

    hasOrganizationUserAdminAccess(user: AuthenticatedUser): boolean {
        return user.permissions.orgToUserAdminPermissions.size > 0;
    }

    hasOrganizationGatewayAdminAccess(user: AuthenticatedUser): boolean {
        return user.permissions.orgToGatewayAdminPermissions.size > 0;
    }

    hasReadAccess(user: AuthenticatedUser): boolean {
        return user.permissions.orgToReadPermissions.size > 0;
    }
}
