import { Module, forwardRef } from "@nestjs/common";

import { ApplicationModule } from "@modules/device-management/application.module";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { UserModule } from "@modules/user-management/user.module";
import { PermissionService } from "@services/user-management/permission.service";
import { PermissionController } from "@user-management-controller/permission.controller";

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
