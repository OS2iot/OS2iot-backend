import { Module } from "@nestjs/common";
import { DeviceModelService } from "@services/device-management/device-model.service";
import { DeviceModelController } from "@admin-controller/device-model.controller";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";

@Module({
    imports: [SharedModule, OrganizationModule],
    providers: [DeviceModelService],
    controllers: [DeviceModelController],
    exports: [DeviceModelService],
})
export class DeviceModelModule {}
