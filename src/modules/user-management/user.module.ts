import { forwardRef, Module } from "@nestjs/common";

import { SharedModule } from "@modules/shared.module";
import { PermissionModule } from "@modules/user-management/permission.module";
import { UserBootstrapperService } from "@services/user-management/user-bootstrapper.service";
import { UserService } from "@services/user-management/user.service";
import { UserController } from "@user-management-controller/user.controller";
import { OrganizationModule } from "./organization.module";
import { ConfigModule } from "@nestjs/config";
import configuration from "@config/configuration";
import { OS2IoTMail } from "@services/os2iot-mail.service";
import { TemporaryAccessService } from "@services/temporary-access.service";

@Module({
  imports: [
    SharedModule,
    ConfigModule.forRoot({ load: [configuration] }),
    forwardRef(() => PermissionModule),
    forwardRef(() => OrganizationModule),
  ],
  controllers: [UserController],
  providers: [TemporaryAccessService, UserService, UserBootstrapperService, OS2IoTMail],
  exports: [UserService],
})
export class UserModule {}
