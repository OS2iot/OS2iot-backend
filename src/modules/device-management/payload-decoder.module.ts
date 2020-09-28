import { Module } from "@nestjs/common";

import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { DataTargetModule } from "@modules/device-management/data-target.module";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { PayloadDecoderService } from "@services/data-management/payload-decoder.service";

@Module({
    imports: [SharedModule, IoTDeviceModule, DataTargetModule, OrganizationModule],
    exports: [PayloadDecoderService],
    controllers: [PayloadDecoderController],
    providers: [PayloadDecoderService],
})
export class PayloadDecoderModule {}
