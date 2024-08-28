import { Module } from "@nestjs/common";

import { SigfoxApiUsersService } from "@services/sigfox/sigfox-api-users.service";
import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";

@Module({
  imports: [SigFoxAdministrationModule],
  providers: [SigfoxApiUsersService],
  exports: [SigfoxApiUsersService],
})
export class SigFoxUsersModule {}
