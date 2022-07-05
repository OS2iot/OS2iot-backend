import { HttpModule, CacheModule, Module } from "@nestjs/common";

import { FiwareDataTargetService, AuthenticationTokenProvider } from "@services/data-targets/fiware-data-target.service";

@Module({
    imports: [HttpModule, CacheModule.register()],
    providers: [FiwareDataTargetService, AuthenticationTokenProvider],
    exports: [FiwareDataTargetService],
})

export class DataTargetFiwareSenderModule {}
