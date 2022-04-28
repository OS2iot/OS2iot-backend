import { BadRequestException, Query } from "@nestjs/common";
import {
    Body,
    Controller,
    Delete,
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
import { OrganizationPermission } from "@entities/permission.entity";
import { Permission } from "@entities/permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import {
    checkIfUserHasAdminAccessToOrganization,
    checkIfUserIsGlobalAdmin,
} from "@helpers/security-helper";
import { PermissionService } from "@services/user-management/permission.service";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { UserService } from "@services/user-management/user.service";
import { ListAllUsersResponseDto } from "@dto/list-all-users-response.dto";
import { ListAllPaginated } from "@dto/list-all-paginated.dto";
import { ListAllPermissionsDto } from "@dto/list-all-permissions.dto";
import { ApplicationService } from "@services/device-management/application.service";
import { ListAllApplicationsResponseDto } from "@dto/list-all-applications-response.dto";
import { PermissionRequestAcceptUser } from "@dto/user-management/add-user-to-permission.dto";
import { OrganizationService } from "@services/user-management/organization.service";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@OrganizationAdmin()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiTags("User Management")
@Controller("permission")
export class PermissionController {
    constructor(
        private permissionService: PermissionService,
        private userService: UserService,
        private applicationService: ApplicationService,
        private organizationService: OrganizationService
    ) {}

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

    @Put("/acceptUser")
    @ApiOperation({ summary: "add user to permission" })
    async addUserToPermission(
        @Req() req: AuthenticatedRequest,
        @Body() dto: PermissionRequestAcceptUser
    ): Promise<User> {
        try {
            checkIfUserHasAdminAccessToOrganization(req, dto.organizationId);
            let dbPermission: Permission;

            const permissions: OrganizationPermission[] = await this.permissionService.findOneWithRelations(
                dto.organizationId
            );

            const org: Organization = await this.organizationService.mapPermissionsToOneOrganization(
                permissions
            );
            
            const user: User = await this.userService.findOne(dto.userId);
            for (let index = 0; index < org.permissions.length; index++) {
                if (org.permissions[index].type === dto.level) {
                    dbPermission = await this.permissionService.getPermission(
                        org.permissions[index].id
                    );
                }
            }
            const resultUser = await this.userService.acceptUser(user, org, dbPermission);

            AuditLog.success(
                ActionType.UPDATE,
                Permission.name,
                req.user.userId,
                resultUser.id,
                resultUser.name
            );
            return resultUser;
        } catch (err) {
            AuditLog.fail(ActionType.UPDATE, Permission.name, req.user.userId);
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
        @Req() req: AuthenticatedRequest,
        @Query() query?: ListAllPermissionsDto
    ): Promise<ListAllPermissionsResponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return this.permissionService.getAllPermissions(query);
        } else {
            const allowedOrganizations = req.user.permissions.getAllOrganizationsWithAtLeastAdmin();
            return this.permissionService.getAllPermissionsInOrganizations(
                allowedOrganizations,
                query
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

        if (
            req.user.permissions.isGlobalAdmin ||
            permission.type == PermissionType.GlobalAdmin
        ) {
            return permission;
        } else {
            const organizationPermission = permission as OrganizationPermission;
            checkIfUserHasAdminAccessToOrganization(
                req,
                organizationPermission.organization.id
            );

            return organizationPermission;
        }
    }

    @Get(":id/applications")
    @ApiOperation({ summary: "Get applications of a permissions entity" })
    @ApiNotFoundResponse()
    async getApplicationsOnOnePermissions(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Query() query?: ListAllPaginated
    ): Promise<ListAllApplicationsResponseDto> {
        let applicationsPromise;
        let permission;
        try {
            applicationsPromise = this.applicationService.getApplicationsOnPermissionId(
                id,
                query
            );
            permission = await this.permissionService.getPermission(id);
        } catch (err) {
            throw new NotFoundException();
        }

        if (
            req.user.permissions.isGlobalAdmin ||
            permission.type == PermissionType.GlobalAdmin
        ) {
            return await applicationsPromise;
        } else {
            const organizationPermission = permission as OrganizationPermission;
            checkIfUserHasAdminAccessToOrganization(
                req,
                organizationPermission.organization.id
            );

            return await applicationsPromise;
        }
    }

    @Get(":id/users")
    @ApiOperation({ summary: "Get user of a permissions entity" })
    @ApiNotFoundResponse()
    async getUserOnOnePermissions(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Query() query?: ListAllPaginated
    ): Promise<ListAllUsersResponseDto> {
        let users;
        let permission;
        try {
            users = this.userService.getUsersOnPermissionId(id, query);
            permission = await this.permissionService.getPermission(id);
        } catch (err) {
            throw new NotFoundException();
        }

        if (
            req.user.permissions.isGlobalAdmin ||
            permission.type == PermissionType.GlobalAdmin
        ) {
            return await users;
        } else {
            const organizationPermission = permission as OrganizationPermission;
            checkIfUserHasAdminAccessToOrganization(
                req,
                organizationPermission?.organization?.id
            );

            return users;
        }
    }
}
