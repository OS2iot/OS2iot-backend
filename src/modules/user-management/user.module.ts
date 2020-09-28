import { Module, forwardRef } from "@nestjs/common";
import { UserService } from "@services/user-management/user.service";
import { UserController } from "@user-management-controller/user.controller";
import { UserBootstrapperService } from "@services/user-management/user-bootstrapper.service";
import { PermissionModule } from "@modules/user-management/permission.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, forwardRef(() => PermissionModule)],
    controllers: [UserController],
    providers: [UserService, UserBootstrapperService],
    exports: [UserService],
})
export class UserModule {}
