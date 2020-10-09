import { BadRequestException, Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as _ from "lodash";
import { In, Repository, getManager } from "typeorm";

import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ListAllPermissionsReponseDto } from "@dto/list-all-permissions-reponse.dto";
import { PermissionMinimalDto } from "@dto/permission-minimal.dto";
import { UserPermissions } from "@dto/permission-organization-application.dto";
import { CreatePermissionDto } from "@dto/user-management/create-permission.dto";
import { UpdatePermissionDto } from "@dto/user-management/update-permission.dto";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { Permission } from "@entities/permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { User } from "@entities/user.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { ApplicationService } from "@services/device-management/application.service";
import { OrganizationService } from "@services/user-management/organization.service";

import { UserService } from "./user.service";

@Injectable()
export class PermissionService {
    constructor(
        @InjectRepository(Permission)
        private permissionReposity: Repository<Permission>,
        @Inject(forwardRef(() => OrganizationService))
        private organizationService: OrganizationService,
        @Inject(forwardRef(() => UserService))
        private userService: UserService,
        @Inject(forwardRef(() => ApplicationService))
        private applicationService: ApplicationService
    ) {}

    READ_SUFFIX = " - Read";
    WRITE_SUFFIX = " - Write";
    ADMIN_SUFFIX = " - OrganizationAdmin";

    async createDefaultPermissions(org: Organization): Promise<OrganizationPermission[]> {
        const readPermission = new ReadPermission(org.name + this.READ_SUFFIX, org);
        const writePermission = new WritePermission(org.name + this.WRITE_SUFFIX, org);
        const adminPermission = new OrganizationAdminPermission(
            org.name + this.ADMIN_SUFFIX,
            org
        );
        // Use the manager since otherwise, we'd need a repository for each of them
        const entityManager = getManager();
        return await entityManager.save([
            adminPermission,
            writePermission,
            readPermission,
        ]);
    }

    async findOrCreateGlobalAdminPermission(): Promise<GlobalAdminPermission> {
        const globalAdmin = await getManager().findOne(GlobalAdminPermission);
        if (globalAdmin) {
            return globalAdmin;
        }

        return await getManager().save(new GlobalAdminPermission());
    }

    async createNewPermission(dto: CreatePermissionDto): Promise<Permission> {
        let permission;
        const org: Organization = await this.organizationService.findByIdWithRelations(
            dto.organizationId
        );

        switch (dto.level) {
            case PermissionType.OrganizationAdmin: {
                permission = new OrganizationAdminPermission(dto.name, org);
                break;
            }
            case PermissionType.Write: {
                permission = new WritePermission(dto.name, org);
                break;
            }
            case PermissionType.Read: {
                permission = new ReadPermission(dto.name, org);
                break;
            }
            default:
                throw new BadRequestException("Bad PermissionLevel");
        }

        await this.mapToPermission(permission, dto);

        return await getManager().save(permission);
    }

    async addUsersToPermission(permission: Permission, users: User[]): Promise<void> {
        users.forEach(x => {
            x.permissions = _.union(x.permissions, [permission]);
        });
    }

    async removeUserFromPermission(permission: Permission, user: User): Promise<void> {
        user.permissions = user.permissions.filter(x => x.id != permission.id);
    }

    async updatePermission(id: number, dto: UpdatePermissionDto): Promise<Permission> {
        const permission = await getManager().findOne(Permission, {
            where: { id: id },
            relations: ["organization", "users", "applications"],
        });

        permission.name = dto.name;

        await this.mapToPermission(permission, dto);

        const savedPermission = await getManager().save(permission);

        return savedPermission;
    }

    private async mapToPermission(
        permission: Permission,
        dto: UpdatePermissionDto
    ): Promise<void> {
        if (
            permission.type == PermissionType.Read ||
            permission.type == PermissionType.Write
        ) {
            (permission as OrganizationApplicationPermission).applications = await this.applicationService.findManyByIds(
                dto.applicationIds
            );
        }
        permission.users = await this.userService.findManyUsersByIds(dto.userIds);
    }

    private async setApplicationsOnPermission(
        permission: OrganizationApplicationPermission,
        dto: UpdatePermissionDto
    ) {
        permission.applications = await this.applicationService.findManyByIds(
            dto.applicationIds
        );
    }

    async deletePermission(id: number): Promise<DeleteResponseDto> {
        const res = await getManager().delete(Permission, id);
        return new DeleteResponseDto(res.affected);
    }

    async getAllPermissions(): Promise<ListAllPermissionsReponseDto> {
        const [data, count] = await getManager().findAndCount(Permission, {
            relations: ["organization", "users"],
        });

        return {
            data: data,
            count: count,
        };
    }

    async getAllPermissionsInOrganizations(
        orgs: number[]
    ): Promise<ListAllPermissionsReponseDto> {
        const [data, count] = await getManager().findAndCount(OrganizationPermission, {
            where: { organization: In(orgs) },
            relations: ["organization", "users"],
        });

        return {
            data: data,
            count: count,
        };
    }

    async getPermission(id: number): Promise<Permission> {
        return await getManager().findOneOrFail(Permission, {
            where: { id: id },
            relations: ["organization", "users", "applications"],
        });
    }

    async findPermissionsForUser(userId: number): Promise<PermissionMinimalDto[]> {
        return await this.permissionReposity
            .createQueryBuilder("permission")
            .leftJoin("permission.users", "user")
            .leftJoinAndSelect(
                "application_permissions_permission",
                "application_permission",
                '"permission"."id" = "application_permission"."permissionId"'
            )
            .leftJoinAndSelect(
                "application",
                "application",
                '"application"."id"="application_permission"."applicationId" '
            )
            .where("user.id = :id", { id: userId })
            .select([
                "permission.type as permission_type",
                "permission.organization as organization_id",
                "application.id as application_id",
            ])
            .getRawMany();
    }

    async findPermissionsForOrgAdminWithApplications(
        userId: number
    ): Promise<PermissionMinimalDto[]> {
        return await this.permissionReposity
            .createQueryBuilder("permission")
            .leftJoin("permission.users", "user")
            .leftJoinAndSelect("permission.organization", "organization")
            .leftJoinAndSelect("organization.applications", "application")
            .where("permission.type = :permType AND user.id = :id", {
                permType: PermissionType.OrganizationAdmin,
                id: userId,
            })
            .select([
                "permission.type as permission_type",
                "permission.organization as organization_id",
                "application.id as application_id",
            ])
            .getRawMany();
    }

    async findPermissionGroupedByLevelForUser(userId: number): Promise<UserPermissions> {
        let permissions = await this.findPermissionsForUser(userId);
        if (this.isOrganizationAdmin(permissions)) {
            // For organization admins, we need to fetch all applications they have permissions to
            const permissionsForOrgAdmin = await this.findPermissionsForOrgAdminWithApplications(
                userId
            );
            permissions = _.union(permissions, permissionsForOrgAdmin);
        }

        const res = new UserPermissions();

        permissions.forEach(p => {
            if (p.permission_type == PermissionType.GlobalAdmin) {
                res.isGlobalAdmin = true;
            } else if (p.permission_type == PermissionType.OrganizationAdmin) {
                res.organizationAdminPermissions.add(p.organization_id);
                // Also grant writePermission to the application
                this.addOrUpdate(res.writePermissions, p);
            } else if (p.permission_type == PermissionType.Write) {
                this.addOrUpdate(res.writePermissions, p);
            } else if (p.permission_type == PermissionType.Read) {
                this.addOrUpdate(res.readPermissions, p);
            }
        });

        return res;
    }

    private isOrganizationAdmin(permissions: PermissionMinimalDto[]) {
        return permissions.some(
            x => x.permission_type == PermissionType.OrganizationAdmin
        );
    }

    private addOrUpdate(permissions: Map<number, number[]>, p: PermissionMinimalDto) {
        if (!permissions.has(p.organization_id)) {
            permissions.set(p.organization_id, []);
        }
        const applications = permissions.get(p.organization_id);
        if (p.application_id != null) {
            applications.push(p.application_id);
        }
        permissions.set(p.organization_id, applications);
    }
}
