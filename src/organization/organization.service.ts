import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Organization } from "@entities/organization.entity";
import { Repository } from "typeorm";
import { CreateOrganizationDto } from "./create-organization.dto";

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>
    ) {}

    private readonly logger = new Logger(OrganizationService.name, true);

    async createOrganization(
        dto: CreateOrganizationDto
    ): Promise<Organization> {
        const organization = new Organization();
        organization.name = dto.name;

        return await this.organizationRepository.save(organization);
    }
}
