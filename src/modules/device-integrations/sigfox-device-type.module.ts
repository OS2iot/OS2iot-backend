import { SigfoxDeviceTypeController } from "@admin-controller/sigfox/sigfox-device-type.controller";
import { AuthModule } from "@modules/user-management/auth.module";
import { Module } from "@nestjs/common";
import { SigFoxApiDeviceTypeService } from "@services/sigfox/sigfox-api-device-type.service";
import { SigFoxAdministrationModule } from "./sigfox-administration.module";
import { SigFoxGroupModule } from "./sigfox-group.module";
import { SigFoxUsersModule } from "./sigfox-users.module";

@Module({
    imports: [
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
