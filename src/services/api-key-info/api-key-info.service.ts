import { Organization } from "@entities/organization.entity";
import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { OrganizationService } from "@services/user-management/organization.service";

@Injectable()
export class ApiKeyInfoService {
  constructor(
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService
  ) {}

  private readonly logger = new Logger(ApiKeyInfoService.name, { timestamp: true });

  findOrganization(orgId: number): Promise<Organization> {
    return this.organizationService.findById(orgId);
  }
}
