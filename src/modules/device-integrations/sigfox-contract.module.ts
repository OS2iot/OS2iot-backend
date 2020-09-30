import { AuthModule } from "@modules/user-management/auth.module";
import { Module } from "@nestjs/common";
import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";
import { SigFoxGroupModule } from "@modules/device-integrations/sigfox-group.module";
import { SigFoxUsersModule } from "@modules/device-integrations/sigfox-users.module";
import { SigFoxApiContractService } from "@services/sigfox/sigfox-api-contract.service";
import { SigFoxApiContractController } from "@admin-controller/sigfox/sigfox-api-contract.controller";

@Module({
    imports: [
        AuthModule,
        SigFoxGroupModule,
        SigFoxAdministrationModule,
        SigFoxUsersModule,
    ],
    controllers: [SigFoxApiContractController],
    providers: [SigFoxApiContractService],
    exports: [SigFoxApiContractService],
})
export class SigfoxContractModule {}
