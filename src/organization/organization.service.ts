import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Organization } from "@entities/organization.entity";
import { Repository } from "typeorm";
import { CreateOrganizationDto } from "./create-organization.dto";
import { PermissionService } from "../permission/permission.service";

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService
    ) {}

    private readonly logger = new Logger(OrganizationService.name, true);

    async createOrganization(
        dto: CreateOrganizationDto
    ): Promise<Organization> {
        const organization = new Organization();
        organization.name = dto.name;

        const res = await this.organizationRepository.save(organization);

        await this.permissionService.createDefaultPermissions(res);

        return res;
    }

    async findById(organizationId: number): Promise<Organization> {
        return await this.organizationRepository.findOne(organizationId);
    }
}
