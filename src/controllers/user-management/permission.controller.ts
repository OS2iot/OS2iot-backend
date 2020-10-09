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
import { ListAllPermissionsReponseDto } from "@dto/list-all-permissions-reponse.dto";
import { CreatePermissionDto } from "@dto/user-management/create-permission.dto";
import { UpdatePermissionDto } from "@dto/user-management/update-permission.dto";
import { AuthenticatedRequest } from "@entities/dto/internal/authenticated-request";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { Permission } from "@entities/permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import {
    checkIfUserHasAdminAccessToOrganization,
    checkIfUserIsGlobalAdmin,
} from "@helpers/security-helper";
import { PermissionService } from "@services/user-management/permission.service";

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
        checkIfUserHasAdminAccessToOrganization(req, dto.organizationId);

        return await this.permissionService.createNewPermission(dto);
    }

    @Put(":id")
    @ApiOperation({ summary: "Update permission" })
    async updatePermission(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() dto: UpdatePermissionDto
    ): Promise<Permission> {
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

        return await this.permissionService.updatePermission(id, dto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete a permission entity" })
    async deletePermission(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
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

        return await this.permissionService.deletePermission(id);
    }

    @Get()
    @ApiOperation({ summary: "Get list of all permissions" })
    async getAllPermissions(
        @Req() req: AuthenticatedRequest
    ): Promise<ListAllPermissionsReponseDto> {
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
