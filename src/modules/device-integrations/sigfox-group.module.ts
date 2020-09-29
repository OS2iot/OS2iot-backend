import { Module } from "@nestjs/common";

import { SigfoxGroupController } from "@admin-controller/sigfox/sigfox-group.controller";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";
import { SigFoxAdministrationModule } from "./sigfox-administration.module";

@Module({
    imports: [SharedModule, OrganizationModule, SigFoxAdministrationModule],
    controllers: [SigfoxGroupController],
    providers: [SigFoxGroupService],
    exports: [SigFoxGroupService],
})
export class SigFoxGroupModule {}
