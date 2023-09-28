import { forwardRef, Module } from "@nestjs/common";
import { ApplicationController } from "@admin-controller/application.controller";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { ApplicationService } from "@services/device-management/application.service";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { PermissionModule } from "@modules/user-management/permission.module";
import { MulticastModule } from "./multicast.module";
import { DataTargetModule } from "@modules/device-management/data-target.module";

@Module({
    imports: [
        SharedModule,
        forwardRef(() => OrganizationModule),
        forwardRef(() => PermissionModule),
        forwardRef(() => MulticastModule), // because of circular reference
        forwardRef(() => DataTargetModule),
        ChirpstackAdministrationModule,
    ],
    exports: [ApplicationService],
    controllers: [ApplicationController],
    providers: [ApplicationService],
})
export class ApplicationModule {}
