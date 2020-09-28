import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ListAllOrganizationsReponseDto } from "@dto/list-all-organizations-response.dto";
import { CreateOrganizationDto } from "@dto/user-management/create-organization.dto";
import { UpdateOrganizationDto } from "@dto/user-management/update-organization.dto";
import { Organization } from "@entities/organization.entity";
import { ErrorCodes } from "@enum/error-codes.enum";

import { PermissionService } from "./permission.service";

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

        try {
            const res = await this.organizationRepository.save(organization);

            await this.permissionService.createDefaultPermissions(res);

            return res;
        } catch (err) {
            throw new BadRequestException(ErrorCodes.OrganizationAlreadyExists);
        }
    }

    async update(id: number, dto: UpdateOrganizationDto): Promise<Organization> {
        const org = await this.findById(id);
        org.name = dto.name;

        return await this.organizationRepository.save(org);
    }

    async findAll(): Promise<ListAllOrganizationsReponseDto> {
        const [data, count] = await this.organizationRepository.findAndCount({
            relations: ["permissions", "applications"],
        });

        return {
            count: count,
            data: data,
        };
    }

    async findAllInOrganizationList(
        allowedOrganizations: number[]
    ): Promise<ListAllOrganizationsReponseDto> {
        if (allowedOrganizations.length === 0) {
            return { count: 0, data: [] };
        }
        const [data, count] = await this.organizationRepository.findAndCount({
            where: { id: In(allowedOrganizations) },
            relations: ["permissions", "applications"],
        });

        return {
            count: count,
            data: data,
        };
    }

    async findById(organizationId: number): Promise<Organization> {
        return await this.organizationRepository.findOneOrFail(organizationId, {
            relations: ["permissions", "applications", "applications.iotDevices"],
        });
    }

    async delete(id: number): Promise<DeleteResponseDto> {
        const res = await this.organizationRepository.delete(id);
        return new DeleteResponseDto(res.affected);
    }
}
