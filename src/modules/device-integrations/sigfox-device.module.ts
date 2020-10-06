import { AuthModule } from "@modules/user-management/auth.module";
import { Module } from "@nestjs/common";
import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";
import { SigFoxGroupModule } from "@modules/device-integrations/sigfox-group.module";
import { SigFoxUsersModule } from "@modules/device-integrations/sigfox-users.module";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { SigFoxApiDeviceController } from "@admin-controller/sigfox/sigfox-api-device.controller";

@Module({
    imports: [
        AuthModule,
        SigFoxGroupModule,
        SigFoxAdministrationModule,
        SigFoxUsersModule,
    ],
    controllers: [SigFoxApiDeviceController],
    providers: [SigFoxApiDeviceService],
    exports: [SigFoxApiDeviceService],
})
export class SigfoxDeviceModule {}
