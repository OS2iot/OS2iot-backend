import { Module, forwardRef } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { PermissionController } from "./permission.controller";
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
import { OrganizationModule } from "../organization/organization.module";
import { OrganizationService } from "../organization/organization.service";
import { UserModule } from "../user/user.module";

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
