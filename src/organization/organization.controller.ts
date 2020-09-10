import { Controller, Logger, Body, Post } from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { Organization } from "@entities/organization.entity";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateOrganizationDto } from "./create-organization.dto";

@ApiTags("User Management")
@Controller("organization")
export class OrganizationController {
    constructor(private organizationService: OrganizationService) {}
    private readonly logger = new Logger(OrganizationController.name);

    @Post()
    @ApiOperation({ summary: "Create a new Organization" })
    async create(
        @Body() createOrganizationDto: CreateOrganizationDto
    ): Promise<Organization> {
        return await this.organizationService.createOrganization(
            createOrganizationDto
        );
    }

    // TODO: RUD
}
