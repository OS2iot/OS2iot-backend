import {
    Controller,
    Post,
    Body,
    Put,
    Param,
    UseGuards,
    Get,
    Req,
    ForbiddenException,
    Delete,
    NotFoundException,
    ParseIntPipe,
} from "@nestjs/common";
import { PermissionService } from "@services/user-management/permission.service";
import {
    ApiOperation,
    ApiTags,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
} from "@nestjs/swagger";
import { Permission } from "@entities/permission.entity";
import { AuthenticatedRequest } from "@entities/dto/internal/authenticated-request";
import { checkIfUserHasAdminAccessToOrganization } from "@helpers/security-helper";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { CreatePermissionDto } from "@dto/user-management/create-permission.dto";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { RolesGuard } from "@auth/roles.guard";
import { OrganizationAdmin } from "@auth/roles.decorator";
import { UpdatePermissionDto } from "@dto/user-management/update-permission.dto";
import { ListAllPermissionsReponseDto } from "@dto/list-all-permissions-reponse.dto";
import { BadRequestException } from "@nestjs/common";

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
        checkIfUserHasAdminAccessToOrganization(req, permission.id);

        return await this.permissionService.updatePermission(id, dto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete a permission entity" })
    async deletePermission(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        const permission = await this.permissionService.getPermission(id);
        checkIfUserHasAdminAccessToOrganization(req, permission.id);
        if (permission.type == PermissionType.GlobalAdmin) {
            throw new BadRequestException("You cannot delete GlobalAdmin");
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
