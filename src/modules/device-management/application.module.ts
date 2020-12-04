import { Module, forwardRef } from "@nestjs/common";

import { ApplicationController } from "@admin-controller/application.controller";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { ApplicationService } from "@services/device-management/application.service";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";
import { PermissionModule } from "@modules/user-management/permission.module";

@Module({
    imports: [
        SharedModule,
        forwardRef(() => OrganizationModule),
        forwardRef(() => PermissionModule),
        ChirpstackAdministrationModule,
    ],
    exports: [ApplicationService],
    controllers: [ApplicationController],
    providers: [ApplicationService],
})
export class ApplicationModule {}
