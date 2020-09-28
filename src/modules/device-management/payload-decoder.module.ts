import { Module } from "@nestjs/common";
import { PayloadDecoderService } from "@services/data-management/payload-decoder.service";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { IoTDeviceModule } from "@modules/device-management/iot-device.module";
import { DataTargetModule } from "@modules/device-management/data-target.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, IoTDeviceModule, DataTargetModule, OrganizationModule],
    exports: [PayloadDecoderService],
    controllers: [PayloadDecoderController],
    providers: [PayloadDecoderService],
})
export class PayloadDecoderModule {}
