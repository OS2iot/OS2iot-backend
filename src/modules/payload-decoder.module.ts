import { Module } from "@nestjs/common";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { IoTDeviceModule } from "@modules/iot-device.module";
import { DataTargetModule } from "./data-target.module";
import { OrganizationModule } from "./organization.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, IoTDeviceModule, DataTargetModule, OrganizationModule],
    exports: [PayloadDecoderService],
    controllers: [PayloadDecoderController],
    providers: [PayloadDecoderService],
})
export class PayloadDecoderModule {}
