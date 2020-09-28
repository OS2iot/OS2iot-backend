import { forwardRef, Module } from "@nestjs/common";
import { PermissionService } from "@services/user-management/permission.service";
import { PermissionController } from "@user-management-controller/permission.controller";
import { ApplicationModule } from "./application.module";
import { OrganizationModule } from "./organization.module";
import { SharedModule } from "@modules/shared.module";

import { UserModule } from "./user.module";

@Module({
    imports: [
        SharedModule,
        forwardRef(() => ApplicationModule),
        forwardRef(() => UserModule),
        forwardRef(() => OrganizationModule),
    ],
    providers: [PermissionService],
    exports: [PermissionService],
    controllers: [PermissionController],
})
export class PermissionModule {}
