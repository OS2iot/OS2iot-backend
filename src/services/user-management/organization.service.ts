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
import {
    ListAllMinimalOrganizationsResponseDto,
    ListAllOrganizationsResponseDto,
} from "@dto/list-all-organizations-response.dto";
import { CreateOrganizationDto } from "@dto/user-management/create-organization.dto";
import { UpdateOrganizationDto } from "@dto/user-management/update-organization.dto";
import { Organization } from "@entities/organization.entity";
import { ErrorCodes } from "@enum/error-codes.enum";

import { PermissionService } from "./permission.service";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService
    ) {}

    private readonly logger = new Logger(OrganizationService.name, true);

    async create(dto: CreateOrganizationDto, userId: number): Promise<Organization> {
        const organization = new Organization();
        organization.name = dto.name;
        organization.createdBy = userId;
        organization.updatedBy = userId;

        try {
            const res = await this.organizationRepository.save(organization);

            await this.permissionService.createDefaultPermissions(res, userId);

            return res;
        } catch (err) {
            throw new BadRequestException(ErrorCodes.OrganizationAlreadyExists);
        }
    }

    async update(
        id: number,
        dto: UpdateOrganizationDto,
        userId: number
    ): Promise<Organization> {
        const org = await this.findByIdWithRelations(id);
        org.name = dto.name;
        org.updatedBy = userId;

        return await this.organizationRepository.save(org);
    }

    async findAll(query?: ListAllEntitiesDto): Promise<ListAllOrganizationsResponseDto> {
        const sorting: { [id: string]: string | number } = this.getSorting(query);

        const [data, count] = await this.organizationRepository.findAndCount({
            relations: ["applications"],
            take: +query.limit,
            skip: +query.offset,
            order: sorting,
        });

        return {
            count: count,
            data: data,
        };
    }

    async findAllMinimal(): Promise<ListAllMinimalOrganizationsResponseDto> {
        const [data, count] = await this.organizationRepository.findAndCount({
            select: ["id", "name"],
        });

        return {
            count: count,
            data: data,
        };
    }

    async findAllInOrganizationList(
        allowedOrganizations: number[],
        query?: ListAllEntitiesDto
    ): Promise<ListAllOrganizationsResponseDto> {
        const sorting: { [id: string]: string | number } = this.getSorting(query);
        if (allowedOrganizations.length === 0) {
            return { count: 0, data: [] };
        }
        const [data, count] = await this.organizationRepository.findAndCount({
            where: { id: In(allowedOrganizations) },
            relations: ["applications"],
            take: +query.limit,
            skip: +query.offset,
            order: sorting,
        });

        return {
            count: count,
            data: data,
        };
    }

    private getSorting(query: ListAllEntitiesDto) {
        const sorting: { [id: string]: string | number } = {};
        if (
            query.orderOn != null &&
            (query.orderOn == "id" ||
                query.orderOn == "name" ||
                query.orderOn == "lastLogin")
        ) {
            sorting[query.orderOn] = query.sort.toLocaleUpperCase();
        } else {
            sorting["id"] = "ASC";
        }
        return sorting;
    }

    async findById(organizationId: number): Promise<Organization> {
        return await this.organizationRepository.findOneOrFail(organizationId);
    }

    async findByIdWithRelations(organizationId: number): Promise<Organization> {
        return await this.organizationRepository.findOneOrFail(organizationId, {
            relations: ["permissions"],
            loadRelationIds: {
                relations: ["applications.iotDevices", "createdBy", "updatedBy"],
            },
        });
    }

    async findByIdWithPermissions(organizationId: number): Promise<Organization> {
        return await this.organizationRepository.findOneOrFail(organizationId, {
            relations: ["permissions"],
        });
    }

    async delete(id: number): Promise<DeleteResponseDto> {
        const res = await this.organizationRepository.delete(id);
        return new DeleteResponseDto(res.affected);
    }
}
