import { HttpModule, Module } from "@nestjs/common";

import { SharedModule } from "@modules/shared.module";
import { GenericSigfoxAdministationService } from "@services/sigfox/generic-sigfox-administation.service";

@Module({
    imports: [SharedModule, HttpModule],
    providers: [GenericSigfoxAdministationService],
    exports: [GenericSigfoxAdministationService],
})
export class SigFoxAdministrationModule {}
