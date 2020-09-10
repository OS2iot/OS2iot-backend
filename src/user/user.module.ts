import { Module, forwardRef } from "@nestjs/common";
import { UserService } from "./user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "@entities/application.entity";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";
import { Permission } from "@entities/permission.entity";
import { GlobalAdminPermission } from "../entities/global-admin-permission.entity";
import { UserController } from "./user.controller";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { OrganizationApplicationPermission } from "../entities/organization-application-permission.entity";
import { UserBootstrapperService } from "./user-bootstrapper.service";
import { PermissionModule } from "../permission/permission.module";

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
        forwardRef(() => PermissionModule),
    ],
    controllers: [UserController],
    providers: [UserService, UserBootstrapperService],
    exports: [UserService, TypeOrmModule],
})
export class UserModule {}
