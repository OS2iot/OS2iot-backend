import { BadRequestException, Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as _ from "lodash";
import {
    In,
    Repository,
    getManager,
    createQueryBuilder,
    SelectQueryBuilder,
} from "typeorm";

import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ListAllPermissionsResponseDto } from "@dto/list-all-permissions-response.dto";
import { PermissionMinimalDto } from "@dto/permission-minimal.dto";
import { UserPermissions } from "@dto/permission-organization-application.dto";
import { CreatePermissionDto } from "@dto/user-management/create-permission.dto";
import { UpdatePermissionDto } from "@dto/user-management/update-permission.dto";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/organization-permission.entity";
import { Permission } from "@entities/permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { User } from "@entities/user.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { ApplicationService } from "@services/device-management/application.service";
import { OrganizationService } from "@services/user-management/organization.service";

import { UserService } from "./user.service";
import { Application } from "@entities/application.entity";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllPermissionsDto } from "@dto/list-all-permissions.dto";

@Injectable()
export class PermissionService {
    constructor(
        @InjectRepository(Permission)
        private permissionRepository: Repository<Permission>,
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

    async createDefaultPermissions(
        org: Organization,
        userId: number
    ): Promise<OrganizationPermission[]> {
        const readPermission = new ReadPermission(org.name + this.READ_SUFFIX, org, true);
        const writePermission = new WritePermission(
            org.name + this.WRITE_SUFFIX,
            org,
            true
        );
        const adminPermission = new OrganizationAdminPermission(
            org.name + this.ADMIN_SUFFIX,
            org
        );
        readPermission.createdBy = userId;
        readPermission.updatedBy = userId;
        writePermission.createdBy = userId;
        writePermission.updatedBy = userId;
        adminPermission.createdBy = userId;
        adminPermission.updatedBy = userId;

        // Use the manager since otherwise, we'd need a repository for each of them
        const entityManager = getManager();
        const r = await entityManager.save([
            adminPermission,
            writePermission,
            readPermission,
        ]);
        AuditLog.success(ActionType.CREATE, Permission.name, userId, r[0].id, r[0].name);
        AuditLog.success(ActionType.CREATE, Permission.name, userId, r[1].id, r[1].name);
        AuditLog.success(ActionType.CREATE, Permission.name, userId, r[2].id, r[2].name);
        return r;
    }

    async findOrCreateGlobalAdminPermission(): Promise<GlobalAdminPermission> {
        const globalAdmin = await getManager().findOne(GlobalAdminPermission);
        if (globalAdmin) {
            return globalAdmin;
        }

        return await getManager().save(new GlobalAdminPermission());
    }

    async createNewPermission(
        dto: CreatePermissionDto,
        userId: number
    ): Promise<Permission> {
        let permission;
        const org: Organization = await this.organizationService.findById(
            dto.organizationId
        );

        switch (dto.level) {
            case PermissionType.OrganizationAdmin: {
                permission = new OrganizationAdminPermission(dto.name, org);
                break;
            }
            case PermissionType.Write: {
                permission = new WritePermission(
                    dto.name,
                    org,
                    dto.automaticallyAddNewApplications
                );
                break;
            }
            case PermissionType.Read: {
                permission = new ReadPermission(
                    dto.name,
                    org,
                    dto.automaticallyAddNewApplications
                );
                break;
            }
            default:
                throw new BadRequestException("Bad PermissionLevel");
        }

        await this.mapToPermission(permission, dto);
        permission.createdBy = userId;
        permission.updatedBy = userId;

        return await getManager().save(permission);
    }

    async autoAddPermissionsToApplication(app: Application): Promise<void> {
        const permissionsInOrganisation = await getManager().find(
            OrganizationApplicationPermission,
            {
                where: {
                    organization: {
                        id: app.belongsTo.id,
                    },
                    automaticallyAddNewApplications: true,
                },
                relations: ["applications"],
            }
        );

        await Promise.all(
            permissionsInOrganisation.map(async p => {
                p.applications.push(app);
                await getManager().save(p);
            })
        );
    }

    async addUsersToPermission(permission: Permission, users: User[]): Promise<void> {
        users.forEach(x => {
            x.permissions = _.union(x.permissions, [permission]);
        });
    }
    async removeUserFromPermission(permission: Permission, user: User): Promise<void> {
        user.permissions = user.permissions.filter(x => x.id != permission.id);
    }

    async updatePermission(
        id: number,
        dto: UpdatePermissionDto,
        userId: number
    ): Promise<Permission> {
        const permission = await getManager().findOne(Permission, {
            where: { id: id },
            relations: ["organization", "users", "applications"],
        });

        permission.name = dto.name;

        await this.mapToPermission(permission, dto);
        permission.updatedBy = userId;

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

            (permission as OrganizationApplicationPermission).automaticallyAddNewApplications =
                dto.automaticallyAddNewApplications;
        }
        if (dto?.userIds?.length >= 0) {
            permission.users = await this.userService.findManyUsersByIds(dto.userIds);
        }
    }

    async deletePermission(id: number): Promise<DeleteResponseDto> {
        const res = await getManager().delete(Permission, id);
        return new DeleteResponseDto(res.affected);
    }

    async getAllPermissions(
        query?: ListAllPermissionsDto,
        orgs?: number[]
    ): Promise<ListAllPermissionsResponseDto> {
        const orderBy = this.getSorting(query);
        const order: "DESC" | "ASC" =
            query?.sort?.toLocaleUpperCase() == "DESC" ? "DESC" : "ASC";
        let qb: SelectQueryBuilder<Permission> = createQueryBuilder(
            Permission,
            "permission"
        )
            .leftJoinAndSelect("permission.organization", "org")
            .leftJoinAndSelect("permission.users", "user")
            .take(query?.limit ? +query.limit : 100)
            .skip(query?.offset ? +query.offset : 0)
            .orderBy(orderBy, order);

        if (query.userId) {
            qb = qb.where("user.id = :userId", { userId: +query.userId });
        } else if (orgs) {
            qb.where({ organization: In(orgs) });
        } else if (query.organisationId) {
            qb = qb.where("org.id = :orgId", { orgId: +query.organisationId });
        }

        const [data, count] = await qb.getManyAndCount();

        return {
            data: data,
            count: count,
        };
    }

    private getSorting(query: ListAllPermissionsDto) {
        let orderBy = `permission.id`;
        if (
            query.orderOn != null &&
            (query.orderOn == "id" ||
                query.orderOn == "name" ||
                query.orderOn == "type" ||
                query.orderOn == "organisations")
        ) {
            if (query.orderOn == "organisations") {
                orderBy = "org.name";
            } else {
                orderBy = `permission.${query.orderOn}`;
            }
        }
        return orderBy;
    }

    async getAllPermissionsInOrganizations(
        orgs: number[],
        query?: ListAllEntitiesDto
    ): Promise<ListAllPermissionsResponseDto> {
        return this.getAllPermissions(query, orgs);
    }

    async getPermission(id: number): Promise<Permission> {
        return await getManager().findOneOrFail(Permission, {
            where: { id: id },
            relations: ["organization", "users", "applications"],
            loadRelationIds: {
                relations: ["createdBy", "updatedBy"],
            },
        });
    }

    async getGlobalPermission(): Promise<Permission> {
        return await getManager().findOneOrFail(Permission, {
            where: { type: PermissionType.GlobalAdmin },
            relations: ["users"],
        });
    }

    async findPermissionsForUser(userId: number): Promise<PermissionMinimalDto[]> {
        return await this.permissionRepository
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
        return await this.permissionRepository
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
