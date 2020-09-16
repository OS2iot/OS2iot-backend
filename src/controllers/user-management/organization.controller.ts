import {
    Controller,
    Logger,
    Body,
    Post,
    UseGuards,
    Req,
    Put,
    Param,
    Get,
    Delete,
    NotFoundException,
} from "@nestjs/common";
import { OrganizationService } from "@services/user-management/organization.service";
import { Organization } from "@entities/organization.entity";
import {
    ApiOperation,
    ApiTags,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
} from "@nestjs/swagger";
import { CreateOrganizationDto } from "@dto/user-management/create-organization.dto";
import { OrganizationAdmin } from "@auth/roles.decorator";
import { GlobalAdmin } from "@auth/roles.decorator";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { RolesGuard } from "@auth/roles.guard";
import { UpdateOrganizationDto } from "@dto/user-management/update-organization.dto";
import { checkIfUserHasAdminAccessToOrganization } from "@helpers/security-helper";
import { ListAllOrganizationsReponseDto } from "@dto/list-all-organizations-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";

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
        @Param("id") id: number,
        @Body() updateOrganizationDto: UpdateOrganizationDto
    ): Promise<Organization> {
        checkIfUserHasAdminAccessToOrganization(req, id);

        return await this.organizationService.update(id, updateOrganizationDto);
    }

    @Get()
    @ApiOperation({ summary: "Get list of all Organizations" })
    async findAll(
        @Req() req: AuthenticatedRequest
    ): Promise<ListAllOrganizationsReponseDto> {
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
        @Param("id") id: number
    ): Promise<Organization> {
        checkIfUserHasAdminAccessToOrganization(req, id);
        try {
            return await this.organizationService.findById(id);
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an Organization" })
    @ApiNotFoundResponse()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: number
    ): Promise<DeleteResponseDto> {
        checkIfUserHasAdminAccessToOrganization(req, id);

        return await this.organizationService.delete(id);
    }
}
