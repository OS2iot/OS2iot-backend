import { Module } from "@nestjs/common";

import { SigFoxAdministrationModule } from "./sigfox-administration.module";
import { SigfoxApiUsersService } from "@services/sigfox/sigfox-api-users.service";

@Module({
    imports: [SigFoxAdministrationModule],
    controllers: [],
    providers: [SigfoxApiUsersService],
    exports: [SigfoxApiUsersService],
})
export class SigFoxUsersModule {}
