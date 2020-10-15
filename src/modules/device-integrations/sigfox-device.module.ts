import { AuthModule } from "@modules/user-management/auth.module";
import { forwardRef, Module } from "@nestjs/common";
import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";
import { SigFoxGroupModule } from "@modules/device-integrations/sigfox-group.module";
import { SigFoxUsersModule } from "@modules/device-integrations/sigfox-users.module";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { SigFoxApiDeviceController } from "@admin-controller/sigfox/sigfox-api-device.controller";
import { SigfoxApiGroupService } from "@services/sigfox/sigfox-api-group.service";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";

@Module({
    imports: [
        AuthModule,
        SigFoxGroupModule,
        SigFoxAdministrationModule,
        SigFoxUsersModule,
        forwardRef(() => IoTDeviceModule),
    ],
    controllers: [SigFoxApiDeviceController],
    providers: [SigFoxApiDeviceService, SigfoxApiGroupService],
    exports: [SigFoxApiDeviceService, SigfoxApiGroupService],
})
export class SigfoxDeviceModule {}
