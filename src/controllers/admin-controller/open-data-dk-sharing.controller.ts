import {
    ContactPoint,
    Dataset,
    DCATRootObject,
    Distribution,
} from "@dto/open-data-dk-dcat.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { Controller, Get, NotFoundException, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OpenDataDkSharingService } from "@services/data-management/open-data-dk-sharing.service";
import { OrganizationService } from "@services/user-management/organization.service";
import { plainToClass } from "class-transformer";

@ApiTags("OpenData.dk")
@Controller("open-data-dk-sharing")
export class OpenDataDkSharingController {
    constructor(
        private service: OpenDataDkSharingService,
        private organizationService: OrganizationService
    ) {}

    @Get(":organizationId")
    async getCatalog(
        @Param("id", new ParseIntPipe()) orgId: number
    ): Promise<DCATRootObject> {
        const organization = await this.organizationService.findById(orgId);
        if (!organization) {
            throw new NotFoundException(
                `Could not find an organization with the id: ${orgId}`
            );
        }

        return this.service.createDCAT(organization);
    }
}
