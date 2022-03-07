import { SharedModule } from "@modules/shared.module";
import { Module } from "@nestjs/common";
import { ApplicationDeviceTypeService } from "@services/device-management/application-device-type.service";

@Module({
    imports: [SharedModule],
    exports: [ApplicationDeviceTypeService],
    providers: [ApplicationDeviceTypeService],
})
export class ApplicationDeviceTypeModule {}
