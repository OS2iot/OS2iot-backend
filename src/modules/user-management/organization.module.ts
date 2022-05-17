import { SharedModule } from "@modules/shared.module";
import { PermissionModule } from "@modules/user-management/permission.module";
import { forwardRef, Module } from "@nestjs/common";
import { OrganizationService } from "@services/user-management/organization.service";
import { OrganizationController } from "@user-management-controller/organization.controller";
import { UserModule } from "./user.module";

@Module({
    imports: [SharedModule, forwardRef(() => PermissionModule), forwardRef(() => UserModule)],
    providers: [OrganizationService],
    exports: [OrganizationService],
    controllers: [OrganizationController],
})
export class OrganizationModule {}
