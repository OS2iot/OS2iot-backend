import { SigfoxDeviceTypeController } from "@admin-controller/sigfox/sigfox-device-type.controller";
import { AuthModule } from "@modules/user-management/auth.module";
import { Module } from "@nestjs/common";
import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";
import { SigFoxGroupModule } from "@modules/device-integrations/sigfox-group.module";
import { SigFoxUsersModule } from "@modules/device-integrations/sigfox-users.module";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";

@Module({
    imports: [
        AuthModule,
        SigFoxGroupModule,
        SigFoxAdministrationModule,
        SigFoxUsersModule,
    ],
    controllers: [],
    providers: [SigFoxApiDeviceService],
    exports: [SigFoxApiDeviceService],
})
export class SigfoxDeviceModule {}
