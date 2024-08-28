import { SigfoxDeviceTypeController } from "@admin-controller/sigfox/sigfox-device-type.controller";
import { AuthModule } from "@modules/user-management/auth.module";
import { Module } from "@nestjs/common";
import { SigFoxApiDeviceTypeService } from "@services/sigfox/sigfox-api-device-type.service";
import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";
import { SigFoxGroupModule } from "@modules/device-integrations/sigfox-group.module";
import { SigFoxUsersModule } from "@modules/device-integrations/sigfox-users.module";
import { ConfigModule } from "@nestjs/config";
import configuration from "@config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration] }),
    AuthModule,
    SigFoxGroupModule,
    SigFoxAdministrationModule,
    SigFoxUsersModule,
  ],
  controllers: [SigfoxDeviceTypeController],
  providers: [SigFoxApiDeviceTypeService],
  exports: [SigFoxApiDeviceTypeService],
})
export class SigfoxDeviceTypeModule {}
