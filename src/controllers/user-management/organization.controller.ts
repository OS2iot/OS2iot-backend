import {
    Body,
    Controller,
    Delete,
    Get,
    Logger,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
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
import { GlobalAdmin, Read, UserAdmin } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import {
    ListAllMinimalOrganizationsResponseDto,
    ListAllOrganizationsResponseDto,
} from "@dto/list-all-organizations-response.dto";
import { CreateOrganizationDto } from "@dto/user-management/create-organization.dto";
import { UpdateOrganizationDto } from "@dto/user-management/update-organization.dto";
import { Organization } from "@entities/organization.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { OrganizationService } from "@services/user-management/organization.service";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiTags("User Management")
@Controller("organization")
export class OrganizationController {
    constructor(private organizationService: OrganizationService) {}
    private readonly logger = new Logger(OrganizationController.name);

    @GlobalAdmin()
    @Post()
    @ApiOperation({ summary: "Create a new Organization" })
    @UserAdmin()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createOrganizationDto: CreateOrganizationDto
    ): Promise<Organization> {
        try {
            const organization = await this.organizationService.create(
                createOrganizationDto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.CREATE,
                Organization.name,
                req.user.userId,
                organization.id,
                organization.name
            );
            return organization;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, Organization.name, req.user.userId);
            throw err;
        }
    }

    @Put(":id")
    @ApiOperation({ summary: "Update an Organization" })
    @ApiNotFoundResponse()
    @UserAdmin()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() updateOrganizationDto: UpdateOrganizationDto
    ): Promise<Organization> {
        try {
            checkIfUserHasAccessToOrganization(req, id, OrganizationAccessScope.UserAdministrationWrite);

            const organization = await this.organizationService.update(
                id,
                updateOrganizationDto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.UPDATE,
                Organization.name,
                req.user.userId,
                organization.id,
                organization.name
            );
            return organization;
        } catch (err) {
            AuditLog.fail(ActionType.UPDATE, Organization.name, req.user.userId, id);
            if (err.name == "EntityNotFound") {
                throw new NotFoundException();
            }
            throw err;
        }
    }

    @Get("minimal")
    @ApiOperation({
        summary:
            "Get list of the minimal representation of organizations, i.e. id and name.",
    })
    @Read()
    async findAllMinimal(): Promise<ListAllMinimalOrganizationsResponseDto> {
        return await this.organizationService.findAllMinimal();
    }

    @Get()
    @ApiOperation({ summary: "Get list of all Organizations" })
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query?: ListAllEntitiesDto
    ): Promise<ListAllOrganizationsResponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return this.organizationService.findAllPaginated(query);
        } else {
            const allowedOrganizations = req.user.permissions.getAllOrganizationsWithUserAdmin();
            return this.organizationService.findAllInOrganizationList(
                allowedOrganizations,
                query
            );
        }
    }

    @Get(":id")
    @ApiOperation({ summary: "Get one Organization" })
    @ApiNotFoundResponse()
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<Organization> {
        checkIfUserHasAccessToOrganization(req, id, OrganizationAccessScope.UserAdministrationWrite);
        try {
            return await this.organizationService.findByIdWithRelations(id);
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an Organization" })
    @ApiNotFoundResponse()
    @UserAdmin()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        try {
            checkIfUserHasAccessToOrganization(req, id, OrganizationAccessScope.UserAdministrationWrite);

            const result = await this.organizationService.delete(id);

            AuditLog.success(ActionType.DELETE, Organization.name, req.user.userId, id);
            return result;
        } catch (err) {
            AuditLog.fail(ActionType.DELETE, Organization.name, req.user.userId, id);
            throw err;
        }
    }
}
