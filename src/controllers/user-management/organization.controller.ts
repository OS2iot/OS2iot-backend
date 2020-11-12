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
import { GlobalAdmin, Read } from "@auth/roles.decorator";
import { OrganizationAdmin } from "@auth/roles.decorator";
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
import { checkIfUserHasAdminAccessToOrganization } from "@helpers/security-helper";
import { OrganizationService } from "@services/user-management/organization.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@OrganizationAdmin()
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
    async create(
        @Body() createOrganizationDto: CreateOrganizationDto
    ): Promise<Organization> {
        return await this.organizationService.create(createOrganizationDto);
    }

    @Put(":id")
    @ApiOperation({ summary: "Update an Organization" })
    @ApiNotFoundResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() updateOrganizationDto: UpdateOrganizationDto
    ): Promise<Organization> {
        checkIfUserHasAdminAccessToOrganization(req, id);

        return await this.organizationService.update(id, updateOrganizationDto);
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
        @Req() req: AuthenticatedRequest
    ): Promise<ListAllOrganizationsResponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return this.organizationService.findAll();
        } else {
            const allowedOrganizations = req.user.permissions.getAllOrganizationsWithAtLeastAdmin();
            return this.organizationService.findAllInOrganizationList(
                allowedOrganizations
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
        checkIfUserHasAdminAccessToOrganization(req, id);
        try {
            return await this.organizationService.findByIdWithRelations(id);
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an Organization" })
    @ApiNotFoundResponse()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        checkIfUserHasAdminAccessToOrganization(req, id);

        return await this.organizationService.delete(id);
    }
}
