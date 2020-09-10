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
} from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { Organization } from "@entities/organization.entity";
import {
    ApiOperation,
    ApiTags,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CreateOrganizationDto } from "./create-organization.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/user/roles.guard";
import { OrganizationAdmin } from "src/user/roles.decorator";
import { GlobalAdmin } from "../user/roles.decorator";
import { AuthenticatedRequest } from "src/auth/authenticated-request";
import { UpdateOrganizationDto } from "./update-organization.dto";
import { checkIfUserHasAdminAccessToOrganization } from "../auth/security-helper";
import { DeleteResponseDto } from "../entities/dto/delete-application-response.dto";

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
    async findAll(@Req() req: AuthenticatedRequest): Promise<Organization[]> {
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
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: number
    ): Promise<Organization> {
        checkIfUserHasAdminAccessToOrganization(req, id);

        return await this.organizationService.findById(id);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an Organization" })
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: number
    ): Promise<DeleteResponseDto> {
        checkIfUserHasAdminAccessToOrganization(req, id);

        return await this.organizationService.delete(id);
    }
}
