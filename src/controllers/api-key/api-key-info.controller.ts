import { ApiKeyAuthGuard } from "@auth/api-key-auth.guard";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { Organization } from "@entities/organization.entity";
import { BadRequestException, Controller, Get, Logger, Query, Req, UseGuards } from "@nestjs/common";
import { ApiForbiddenResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { ApiKeyInfoService } from "@services/api-key-info/api-key-info.service";
import { ApiAuth } from "@auth/swagger-auth-decorator";

@UseGuards(ApiKeyAuthGuard, RolesGuard)
@ApiAuth()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiTags("API key info")
@Controller("api-key-info")
export class ApiKeyInfoController {
    constructor(private apiKeyInfoService: ApiKeyInfoService) {}
    private readonly logger = new Logger(ApiKeyInfoController.name);

    @Get("organization")
    @ApiOperation({ summary: "Get the organization of an API key" })
    async findApiKeyOrganization(
        @Req() req: AuthenticatedRequest,
        @Query() query?: ListAllEntitiesDto
    ): Promise<Organization> {
        // The API Key will have access to at least read from a specific
        const allowedOrganizations = req.user.permissions.getAllOrganizationsWithAtLeastApplicationRead();

        if (allowedOrganizations.length !== 1) {
            this.logger.error(
                "API key is possibly tied to more than one organization. API key system user id: " + req.user.userId
            );
            throw new BadRequestException();
        }

        return this.apiKeyInfoService.findOrganization(allowedOrganizations[0]);
    }
}
