import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Organization } from "@entities/organization.entity";
import { Repository, In } from "typeorm";
import { CreateOrganizationDto } from "@dto/user-management/create-organization.dto";
import { PermissionService } from "./permission.service";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { UpdateOrganizationDto } from "@dto/user-management/update-organization.dto";

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService
    ) {}

    private readonly logger = new Logger(OrganizationService.name, true);

    async create(dto: CreateOrganizationDto): Promise<Organization> {
        const organization = new Organization();
        organization.name = dto.name;

        const res = await this.organizationRepository.save(organization);

        await this.permissionService.createDefaultPermissions(res);

        return res;
    }

    async update(
        id: number,
        dto: UpdateOrganizationDto
    ): Promise<Organization> {
        const org = await this.findById(id);
        org.name = dto.name;

        return await this.organizationRepository.save(org);
    }

    async findAll(): Promise<Organization[]> {
        return await this.organizationRepository.find();
    }

    async findAllInOrganizationList(
        allowedOrganizations: number[]
    ): Promise<Organization[]> {
        return await this.organizationRepository.find({
            where: { id: In(allowedOrganizations) },
        });
    }

    async findById(organizationId: number): Promise<Organization> {
        return await this.organizationRepository.findOne(organizationId);
    }

    async delete(id: number): Promise<DeleteResponseDto> {
        const res = await this.organizationRepository.delete(id);
        return new DeleteResponseDto(res.affected);
    }
}
