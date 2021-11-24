import { SharedModule } from "@modules/shared.module";
import { PermissionModule } from "@modules/user-management/permission.module";
import { forwardRef, Module } from "@nestjs/common";
import { ApiKeyService } from "@services/api-key-management/api-key.service";
import { ApiKeyController } from "src/controllers/api-key-controller/api-key.controller";

@Module({
    imports: [SharedModule, forwardRef(() => PermissionModule)],
    controllers: [ApiKeyController],
    providers: [ApiKeyService],
    exports: [ApiKeyService],
})
export class ApiKeyModule {}
