import { BadRequestException } from "@nestjs/common";
import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { OrganizationAdmin } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ListAllPermissionsResponseDto } from "@dto/list-all-permissions-response.dto";
import { CreatePermissionDto } from "@dto/user-management/create-permission.dto";
import { UpdatePermissionDto } from "@dto/user-management/update-permission.dto";
import { AuthenticatedRequest } from "@entities/dto/internal/authenticated-request";
import { OrganizationPermission } from "@entities/organization-permission.entity";
import { Permission } from "@entities/permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import {
    checkIfUserHasAdminAccessToOrganization,
    checkIfUserIsGlobalAdmin,
} from "@helpers/security-helper";
import { PermissionService } from "@services/user-management/permission.service";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@OrganizationAdmin()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiTags("User Management")
@Controller("permission")
export class PermissionController {
    constructor(private permissionService: PermissionService) {}

    @Post()
    @ApiOperation({ summary: "Create new permission entity" })
    async createPermission(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreatePermissionDto
    ): Promise<Permission> {
        try {
            checkIfUserHasAdminAccessToOrganization(req, dto.organizationId);

            const result = await this.permissionService.createNewPermission(
                dto,
                req.user.userId
            );

            AuditLog.success(
                ActionType.CREATE,
                Permission.name,
                req.user.userId,
                result.id,
                result.name
            );
            return result;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, Permission.name, req.user.userId);
            throw err;
        }
    }

    @Put(":id")
    @ApiOperation({ summary: "Update permission" })
    async updatePermission(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() dto: UpdatePermissionDto
    ): Promise<Permission> {
        try {
            const permission = await this.permissionService.getPermission(id);
            if (permission.type == PermissionType.GlobalAdmin) {
                checkIfUserIsGlobalAdmin(req);
            } else {
                const organizationPermission = permission as OrganizationPermission;
                checkIfUserHasAdminAccessToOrganization(
                    req,
                    organizationPermission.organization.id
                );
            }

            const result = await this.permissionService.updatePermission(
                id,
                dto,
                req.user.userId
            );

            AuditLog.success(
                ActionType.UPDATE,
                Permission.name,
                req.user.userId,
                result.id,
                result.name
            );
            return result;
        } catch (err) {
            AuditLog.fail(ActionType.UPDATE, Permission.name, req.user.userId, id);
            throw err;
        }
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete a permission entity" })
    async deletePermission(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        try {
            const permission = await this.permissionService.getPermission(id);
            if (permission.type == PermissionType.GlobalAdmin) {
                throw new BadRequestException("You cannot delete GlobalAdmin");
            } else {
                const organizationPermission = permission as OrganizationPermission;
                checkIfUserHasAdminAccessToOrganization(
                    req,
                    organizationPermission.organization.id
                );
            }

            const result = await this.permissionService.deletePermission(id);

            AuditLog.success(ActionType.DELETE, Permission.name, req.user.userId, id);
            return result;
        } catch (err) {
            AuditLog.fail(ActionType.DELETE, Permission.name, req.user.userId, id);
            throw err;
        }
    }

    @Get()
    @ApiOperation({ summary: "Get list of all permissions" })
    async getAllPermissions(
        @Req() req: AuthenticatedRequest
    ): Promise<ListAllPermissionsResponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return this.permissionService.getAllPermissions();
        } else {
            const allowedOrganizations = req.user.permissions.getAllOrganizationsWithAtLeastAdmin();
            return this.permissionService.getAllPermissionsInOrganizations(
                allowedOrganizations
            );
        }
    }

    @Get(":id")
    @ApiOperation({ summary: "Get permissions entity" })
    @ApiNotFoundResponse()
    async getOnePermissions(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<Permission> {
        let permission;
        try {
            permission = await this.permissionService.getPermission(id);
        } catch (err) {
            throw new NotFoundException();
        }

        if (req.user.permissions.isGlobalAdmin) {
            return permission;
        } else {
            if (permission.type == PermissionType.GlobalAdmin) {
                throw new ForbiddenException();
            }

            const organizationPermission = permission as OrganizationPermission;
            checkIfUserHasAdminAccessToOrganization(
                req,
                organizationPermission.organization.id
            );

            return organizationPermission;
        }
    }
}
