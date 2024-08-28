import { Module } from "@nestjs/common";
import { OpenDataDkSharingController } from "@admin-controller/open-data-dk-sharing.controller";
import { OpenDataDkSharingService } from "@services/data-management/open-data-dk-sharing.service";
import { SharedModule } from "@modules/shared.module";
import { OrganizationModule } from "@modules/user-management/organization.module";
import { PayloadDecoderExecutorModuleModule } from "@modules/payload-decoder-executor-module.module";
import { ChirpstackAdministrationModule } from "@modules/device-integrations/chirpstack-administration.module";

@Module({
  imports: [SharedModule, OrganizationModule, PayloadDecoderExecutorModuleModule, ChirpstackAdministrationModule],
  controllers: [OpenDataDkSharingController],
  providers: [OpenDataDkSharingService],
})
export class OpenDataDkSharingModule {}
