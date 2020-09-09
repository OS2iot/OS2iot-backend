import {
    Injectable,
    BadRequestException,
    forwardRef,
    Inject,
} from "@nestjs/common";
import { Organization } from "@entities/organization.entity";
import { Permission } from "@entities/permission.entity";
import { getManager, Repository } from "typeorm";
import { ReadPermission } from "@entities/read-permission.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { CreatePermissionDto } from "./create-permission.dto";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationService } from "../organization/organization.service";
import { UpdatePermissionDto } from "./update-permission.dto";
import * as _ from "lodash";
import { UserService } from "../user/user.service";
import { PermissionMinimalDto } from "../entities/dto/permission-minimal.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { UserPermissions } from "../entities/dto/permission-organization-application.dto";

@Injectable()
export class PermissionService {
    constructor(
        @InjectRepository(Permission)
        private permissionReposity: Repository<Permission>,
        @Inject(forwardRef(() => OrganizationService))
        private organizationService: OrganizationService,
        private userService: UserService
    ) {}

    READ_SUFFIX = " - Read";
    WRITE_SUFFIX = " - Write";
    ADMIN_SUFFIX = " - OrganizationAdmin";

    async createDefaultPermissions(
        org: Organization
    ): Promise<OrganizationPermission[]> {
        const readPermission = new ReadPermission(
            org.name + this.READ_SUFFIX,
            org
        );
        const writePermission = new WritePermission(
            org.name + this.WRITE_SUFFIX,
            org
        );
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

    async createNewPermission(dto: CreatePermissionDto): Promise<Permission> {
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
        return await getManager().save(permission);
    }

    async updatePermission(
        id: number,
        dto: UpdatePermissionDto
    ): Promise<Permission> {
        const permission = await getManager().findOne(OrganizationPermission, {
            where: { id: id },
            relations: ["organization", "users"],
        });

        permission.name = dto.name;
        permission.users = await this.userService.findManyUsersById(
            dto.usesIds
        );

        const savedPermission = await getManager().save(permission);

        return savedPermission;
    }

    async findPermissionsForUser(
        userId: number
    ): Promise<PermissionMinimalDto[]> {
        return await this.permissionReposity
            .createQueryBuilder("permission")
            .leftJoin("permission.users", "user")
            .leftJoinAndSelect("permission.organization", "organization")
            .leftJoinAndSelect("organization.applications", "application")
            .where("user.id = :id", { id: userId })
            .select([
                "permission.type as permission_type",
                "permission.organization as organization_id",
                "application.id as application_id",
            ])
            .getRawMany();
    }

    async findPermissionGroupedByLevelForUser(
        userId: number
    ): Promise<UserPermissions> {
        const permissions = await this.findPermissionsForUser(userId);

        const res = new UserPermissions();

        permissions.forEach(p => {
            if (p.permission_type == PermissionType.GlobalAdmin) {
                this.addOrUpdate(res.globalAdminPermissions, p);
            } else if (p.permission_type == PermissionType.OrganizationAdmin) {
                this.addOrUpdate(res.organizationAdminPermissions, p);
            } else if (p.permission_type == PermissionType.Write) {
                this.addOrUpdate(res.writePermissions, p);
            } else if (p.permission_type == PermissionType.Read) {
                this.addOrUpdate(res.readPermissions, p);
            }
        });

        return res;
    }

    private addOrUpdate(
        permissions: Map<number, number[]>,
        p: PermissionMinimalDto
    ) {
        if (!permissions.has(p.organization_id)) {
            permissions.set(p.organization_id, []);
        }
        const applications = permissions.get(p.organization_id);
        applications.push(p.application_id);
        permissions.set(p.organization_id, applications);
    }
}
