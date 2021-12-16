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
import { GlobalAdminPermission } from "@entities/permissions/global-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/permissions/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/permissions/organization-permission.entity";
import { Permission } from "@entities/permissions/permission.entity";
import { ReadPermission } from "@entities/permissions/read-permission.entity";
import { User } from "@entities/user.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { ApplicationService } from "@services/device-management/application.service";
import { OrganizationService } from "@services/user-management/organization.service";

import { UserService } from "./user.service";
import { Application } from "@entities/application.entity";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllPermissionsDto } from "@dto/list-all-permissions.dto";
import { isOrganizationApplicationPermission } from "@helpers/security-helper";
import { OrganizationGatewayAdminPermission } from "@entities/permissions/organization-gateway-admin-permission.entity";
import { OrganizationUserAdminPermission } from "@entities/permissions/organization-user-admin-permission.entity";
import { OrganizationApplicationAdminPermission } from "@entities/permissions/organization-application-admin-permission.entity";

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

    async createDefaultPermissions(
        org: Organization,
        userId: number
    ): Promise<OrganizationPermission[]> {
        const { readPermission, orgApplicationAdminPermission, orgAdminPermission, orgGatewayAadminPermission } = this.instantiateDefaultPermissions(org, userId);

        // Use the manager since otherwise, we'd need a repository for each of them
        const entityManager = getManager();
        const r = await entityManager.save<OrganizationPermission>([
            readPermission,
            orgApplicationAdminPermission,
            orgAdminPermission,
            orgGatewayAadminPermission,
        ]);
        r.forEach(val =>
            AuditLog.success(ActionType.CREATE, Permission.name, userId, val.id, val.name)
        );
        return r;
    }

    private instantiateDefaultPermissions(org: Organization, userId: number) {
        const nameSuffixSeparator = " - ";
        const readSuffix = `${nameSuffixSeparator}${PermissionType.Read}`;
        const organizationUserAdminSuffix = `${nameSuffixSeparator}${PermissionType.OrganizationUserAdmin}`;
        const organizationGatewayAdminSuffix = `${nameSuffixSeparator}${PermissionType.OrganizationGatewayAdmin}`;
        const organizationApplicationAdminSuffix = `${nameSuffixSeparator}${PermissionType.OrganizationApplicationAdmin}`;

        const readPermission = new ReadPermission(org.name + readSuffix, org, true);
        const orgApplicationAdminPermission = new OrganizationApplicationAdminPermission(
            org.name + organizationApplicationAdminSuffix,
            org,
            true
        );
        const orgAdminPermission = new OrganizationUserAdminPermission(
            org.name + organizationUserAdminSuffix,
            org
        );
        const orgGatewayAadminPermission = new OrganizationGatewayAdminPermission(
            org.name + organizationGatewayAdminSuffix,
            org
        );
        readPermission.createdBy = userId;
        readPermission.updatedBy = userId;
        orgApplicationAdminPermission.createdBy = userId;
        orgApplicationAdminPermission.updatedBy = userId;
        orgAdminPermission.createdBy = userId;
        orgAdminPermission.updatedBy = userId;
        orgGatewayAadminPermission.createdBy = userId;
        orgGatewayAadminPermission.updatedBy = userId;
        return { readPermission, orgApplicationAdminPermission, orgAdminPermission, orgGatewayAadminPermission };
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
        const org: Organization = await this.organizationService.findById(
            dto.organizationId
        );

        const permission = this.createPermission(dto, org);

        await this.mapToPermission(permission, dto);
        permission.createdBy = userId;
        permission.updatedBy = userId;

        return await getManager().save(permission);
    }

    private createPermission(dto: CreatePermissionDto, org: Organization): Permission {
        switch (dto.level) {
            case PermissionType.OrganizationApplicationAdmin: {
                return new OrganizationApplicationAdminPermission(dto.name, org);
            }
            case PermissionType.OrganizationGatewayAdmin: {
                return new OrganizationGatewayAdminPermission(dto.name, org);
            }
            case PermissionType.OrganizationUserAdmin: {
                return new OrganizationUserAdminPermission(dto.name, org);
            }
            case PermissionType.Read: {
                return new ReadPermission(
                    dto.name,
                    org,
                    dto.automaticallyAddNewApplications
                );
            }
            default:
                throw new BadRequestException("Bad PermissionLevel");
        }
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
        if (isOrganizationApplicationPermission(permission)) {
            permission.applications = await this.applicationService.findManyByIds(
                dto.applicationIds
            );

            permission.automaticallyAddNewApplications =
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
                permType: PermissionType.OrganizationApplicationAdmin,
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
        if (this.isOrganizationApplicationAdmin(permissions)) {
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
            } else if (p.permission_type == PermissionType.OrganizationApplicationAdmin) {
                 this.addOrUpdateApplicationIds(res.orgToApplicationAdminPermissions, p);
                // Also grant writePermission to the application
            } else if (p.permission_type == PermissionType.OrganizationGatewayAdmin) {
                res.orgToGatewayAdminPermissions.add(p.organization_id);
            } else if (p.permission_type == PermissionType.OrganizationUserAdmin) {
                res.orgToUserAdminPermissions.add(p.organization_id);
            } else if (p.permission_type == PermissionType.Read) {
                this.addOrUpdateApplicationIds(res.orgToReadPermissions, p);
            }
        });

        return res;
    }

    private isOrganizationApplicationAdmin(permissions: PermissionMinimalDto[]) {
        return permissions.some(
            x => x.permission_type == PermissionType.OrganizationApplicationAdmin
        );
    }

    private addOrUpdateApplicationIds(permissions: Map<number, number[]>, p: PermissionMinimalDto) {
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
