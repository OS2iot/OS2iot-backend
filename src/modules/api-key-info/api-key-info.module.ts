import { ApiKeyInfoController } from "src/controllers/api-key/api-key-info.controller";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { forwardRef, Module } from "@nestjs/common";
import { ApiKeyInfoService } from "@services/api-key-info/api-key-info.service";

@Module({
  imports: [SharedModule, forwardRef(() => OrganizationModule)],
  providers: [ApiKeyInfoService],
  exports: [ApiKeyInfoService],
  controllers: [ApiKeyInfoController],
})
export class ApiKeyInfoModule {}
