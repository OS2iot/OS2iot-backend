import { HttpModule, Module } from "@nestjs/common";

import { GenericSigfoxAdministationService } from "@services/sigfox/generic-sigfox-administation.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { SigfoxGroupController } from "@admin-controller/sigfox/sigfox-group.controller";

@Module({
    imports: [SharedModule, HttpModule, OrganizationModule],
    controllers: [SigfoxGroupController],
    providers: [GenericSigfoxAdministationService, SigFoxGroupService],
    exports: [],
})
export class SigFoxAdministrationModule {}
