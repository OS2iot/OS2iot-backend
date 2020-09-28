import { Module, forwardRef } from "@nestjs/common";
import { OrganizationService } from "@services/user-management/organization.service";
import { OrganizationController } from "@user-management-controller/organization.controller";
import { PermissionModule } from "@modules/permission.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, forwardRef(() => PermissionModule)],
    providers: [OrganizationService],
    exports: [OrganizationService],
    controllers: [OrganizationController],
})
export class OrganizationModule {}
