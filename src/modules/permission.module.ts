import { Application } from "@entities/application.entity";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { OrganizationApplicationPermission } from "@entities/organization-application-permission.entity";
import { Organization } from "@entities/organization.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { Permission } from "@entities/permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { User } from "@entities/user.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionService } from "@services/user-management/permission.service";
import { PermissionController } from "@user-management-controller/permission.controller";
import { ApplicationModule } from "./application.module";
import { OrganizationModule } from "./organization.module";
import { UserModule } from "./user.module";

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
        forwardRef(() => ApplicationModule),
        forwardRef(() => UserModule),
        forwardRef(() => OrganizationModule),
    ],
    providers: [PermissionService],
    exports: [PermissionService],
    controllers: [PermissionController],
})
export class PermissionModule {}
