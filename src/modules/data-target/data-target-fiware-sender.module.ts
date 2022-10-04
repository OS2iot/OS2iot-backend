import { HttpModule, CacheModule, Module } from "@nestjs/common";

import { FiwareDataTargetService } from "@services/data-targets/fiware-data-target.service";
import { AuthenticationTokenProvider, CLIENT_SECRET_PROVIDER, PlainTextClientSecretProvider } from "../../helpers/fiware-token.helper";

@Module({
    imports: [HttpModule, CacheModule.register()],
    providers: [
        FiwareDataTargetService,
        AuthenticationTokenProvider,
        {
            provide: CLIENT_SECRET_PROVIDER,
            useClass: PlainTextClientSecretProvider,
        },
    ],
    exports: [
        FiwareDataTargetService,
        {
            provide: CLIENT_SECRET_PROVIDER,
            useClass: PlainTextClientSecretProvider,
        },
    ],
})

export class DataTargetFiwareSenderModule {}
