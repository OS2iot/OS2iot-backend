import { BadRequestException, Inject, Injectable, Logger, forwardRef, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import {
  ListAllMinimalOrganizationsResponseDto,
  ListAllOrganizationsResponseDto,
} from "@dto/list-all-organizations-response.dto";
import { CreateOrganizationDto } from "@dto/user-management/create-organization.dto";
import { UpdateOrganizationDto } from "@dto/user-management/update-organization.dto";
import { Organization } from "@entities/organization.entity";
import { ErrorCodes } from "@enum/error-codes.enum";

import { PermissionService } from "./permission.service";
import { User } from "@entities/user.entity";
import { UserService } from "./user.service";
import { Permission } from "@entities/permissions/permission.entity";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @Inject(forwardRef(() => PermissionService))
    private permissionService: PermissionService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService
  ) {}

  private readonly logger = new Logger(OrganizationService.name, { timestamp: true });

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

  async update(id: number, dto: UpdateOrganizationDto, userId: number): Promise<Organization> {
    const org = await this.findByIdWithRelations(id);
    org.name = dto.name;
    org.updatedBy = userId;

    return await this.organizationRepository.save(org);
  }

  async updateOpenDataDkRegistered(id: number, userId: number): Promise<Organization> {
    const org = await this.findByIdWithRelations(id);
    org.openDataDkRegistered = true;
    org.updatedBy = userId;
    return await this.organizationRepository.save(org);
  }

  async updateAwaitingUsers(org: Organization, user: User): Promise<Organization> {
    if (!org.awaitingUsers.find(dbUser => dbUser.id === user.id)) {
      org.awaitingUsers.push(user);
    }
    return await this.organizationRepository.save(org);
  }

  async rejectAwaitingUser(user: User, organization: Organization): Promise<Organization> {
    if (organization.awaitingUsers.find(dbUser => dbUser.id === user.id)) {
      const index = organization.awaitingUsers.findIndex(dbUser => dbUser.id === user.id);
      organization.awaitingUsers.splice(index, 1);
      await this.userService.sendRejectionMail(user, organization);
      return await this.organizationRepository.save(organization);
    }
    throw new NotFoundException(ErrorCodes.UserDoesNotExistInArray);
  }

  async findAll(): Promise<ListAllOrganizationsResponseDto> {
    const [data, count] = await this.organizationRepository.findAndCount({
      relations: ["applications", "permissions"],
    });

    return {
      count: count,
      data: data,
    };
  }

  mapPermissionsToOrganizations(permissions: Permission[]): Organization[] {
    const requestedOrganizations: Organization[] = [];

    for (let index = 0; index < permissions.length; index++) {
      if (
        requestedOrganizations.find(org => {
          return permissions[index].organization.id === org.id;
        })
      ) {
      } else {
        requestedOrganizations.push(permissions[index].organization);
      }
    }

    requestedOrganizations.forEach(org => {
      org.permissions = [];
      permissions.forEach(permission => {
        if (org.id === permission.organization.id) {
          org.permissions.push(permission);
        }
      });
    });
    permissions.forEach(permission => {
      permission.organization = null;
    });

    return requestedOrganizations;
  }

  mapPermissionsToOneOrganization(permissions: Permission[]): Organization {
    const org: Organization = new Organization();

    permissions.map(permission => {
      org.id = permission.organization.id;
      org.name = permission.organization.name;
    });

    org.permissions = [];
    permissions.forEach(permission => {
      if (org.id === permission.organization.id) {
        org.permissions.push(permission);
      }
    });
    permissions.forEach(permission => {
      permission.organization = null;
    });
    return org;
  }

  async findAllPaginated(query?: ListAllEntitiesDto): Promise<ListAllOrganizationsResponseDto> {
    const sorting: { [id: string]: string | number } = this.getSorting(query);

    const [data, count] = await this.organizationRepository.findAndCount({
      relations: ["applications"],
      take: query?.limit ? query.limit : 100,
      skip: query?.offset ? query.offset : 0,
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
    if (query?.orderOn != null && (query.orderOn == "id" || query.orderOn == "name" || query.orderOn == "lastLogin")) {
      sorting[query.orderOn] = query.sort.toLocaleUpperCase();
    } else {
      sorting["id"] = "ASC";
    }
    return sorting;
  }

  async findById(organizationId: number): Promise<Organization> {
    return await this.organizationRepository.findOneByOrFail({ id: organizationId });
  }

  async findByIdWithRelations(organizationId: number): Promise<Organization> {
    return await this.organizationRepository.findOneOrFail({
      where: { id: organizationId },
      relations: ["permissions"],
      loadRelationIds: {
        relations: ["applications.iotDevices", "createdBy", "updatedBy"],
      },
    });
  }
  async findByIdWithUsers(organizationId: number): Promise<Organization> {
    return await this.organizationRepository.findOneOrFail({
      where: { id: organizationId },
      relations: ["awaitingUsers"],
    });
  }

  async findByIdWithPermissions(organizationId: number): Promise<Organization> {
    return await this.organizationRepository.findOneOrFail({
      where: { id: organizationId },
      relations: ["permissions"],
    });
  }

  findByPermissionIds(permissionIds: number[]): Promise<Organization[]> {
    return this.organizationRepository
      .createQueryBuilder("organization")
      .innerJoin("organization.permissions", "perm")
      .where("perm.id IN (:...permissionIds)", { permissionIds })
      .getMany();
  }

  async delete(id: number): Promise<DeleteResponseDto> {
    const dbOrganization = await this.organizationRepository.findOne({ where: { id }, relations: { gateways: true } });
    if (dbOrganization?.gateways?.length !== 0) {
      throw new BadRequestException(ErrorCodes.OrganizationCannotBeDeletedHasGateways);
    }

    const res = await this.organizationRepository.delete(dbOrganization.id);
    if (res.affected == 0) {
      throw new NotFoundException();
    }
    return new DeleteResponseDto(res.affected);
  }
}
