import { ApiKeyController } from "src/controllers/api-key/api-key.controller";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { PermissionModule } from "@modules/user-management/permission.module";
import { forwardRef, Module } from "@nestjs/common";
import { ApiKeyService } from "@services/api-key-management/api-key.service";

@Module({
    imports: [SharedModule, forwardRef(() => PermissionModule), forwardRef(() => OrganizationModule)],
    controllers: [ApiKeyController],
    providers: [ApiKeyService],
    exports: [ApiKeyService],
})
export class ApiKeyModule {}
