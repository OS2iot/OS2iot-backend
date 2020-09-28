import { Module, forwardRef } from "@nestjs/common";

import { ApplicationController } from "@admin-controller/application.controller";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { ApplicationService } from "@services/device-management/application.service";

@Module({
    imports: [SharedModule, forwardRef(() => OrganizationModule)],
    exports: [ApplicationService],
    controllers: [ApplicationController],
    providers: [ApplicationService],
})
export class ApplicationModule {}
