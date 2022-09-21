import { HttpModule, CacheModule, Module } from "@nestjs/common";

import { FiwareDataTargetService } from "@services/data-targets/fiware-data-target.service";
import { AuthenticationTokenProvider } from "../../helpers/fiware-token.helper";

@Module({
    imports: [HttpModule, CacheModule.register()],
    providers: [FiwareDataTargetService, AuthenticationTokenProvider],
    exports: [FiwareDataTargetService],
})

export class DataTargetFiwareSenderModule {}
