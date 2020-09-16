import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";
import { Permission } from "@entities/permission.entity";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { OrganizationModule } from "@modules/organization.module";
import { UserModule } from "@modules/user.module";
import { PermissionService } from "@services/user-management/permission.service";
import { PermissionController } from "@user-management-controller/permission.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            Organization,
            User,
            Permission,
            GlobalAdminPermission,
            OrganizationPermission,
            OrganizationAdminPermission,
            OrganizationApplicationPermission,
            ReadPermission,
            WritePermission,
        ]),
        forwardRef(() => OrganizationModule),
        forwardRef(() => UserModule),
    ],
    providers: [PermissionService],
    exports: [PermissionService],
    controllers: [PermissionController],
})
export class PermissionModule {}
