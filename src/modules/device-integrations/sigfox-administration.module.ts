import { SharedModule } from "@modules/shared.module";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { GenericSigfoxAdministationService } from "@services/sigfox/generic-sigfox-administation.service";

@Module({
    imports: [SharedModule, HttpModule],
    providers: [GenericSigfoxAdministationService],
    exports: [GenericSigfoxAdministationService],
})
export class SigFoxAdministrationModule {}
