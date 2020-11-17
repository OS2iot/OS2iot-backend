import { DCATRootObject } from "@dto/open-data-dk-dcat.dto";
import { Controller, Get, NotFoundException, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OpenDataDkSharingService } from "@services/data-management/open-data-dk-sharing.service";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { OrganizationService } from "@services/user-management/organization.service";

@ApiTags("OpenData.dk")
@Controller("open-data-dk-sharing")
export class OpenDataDkSharingController {
    constructor(
        private service: OpenDataDkSharingService,
        private organizationService: OrganizationService
    ) {}

    @Get(":organizationId")
    async getCatalog(
        @Param("organizationId", new ParseIntPipe()) orgId: number
    ): Promise<DCATRootObject> {
        let organization;
        try {
            organization = await this.organizationService.findById(orgId);
        } catch (err) {
            throw new NotFoundException(
                `Could not find an organization with the id: ${orgId}`
            );
        }

        return this.service.createDCAT(organization);
    }

    @Get(":organizationId/data/:shareId")
    async getData(
        @Param("organizationId", new ParseIntPipe()) orgId: number,
        @Param("shareId", new ParseIntPipe()) shareId: number
    ) {
        let organization;
        try {
            organization = await this.organizationService.findById(orgId);
        } catch (err) {
            throw new NotFoundException(
                `Could not find an organization with the id: ${orgId}`
            );
        }

        const dataset = await this.service.findById(shareId, organization.id);
        if (!dataset) {
            throw new NotFoundException(
                `Could not find dataset with id: ${shareId} on organization: ${organization.id}`
            );
        }

        // TODO: Add caching pr. shareId (https://docs.nestjs.com/techniques/caching)
        return this.service.getDecodedDataInDataset(dataset);
    }
}
