import { Module } from "@nestjs/common";
import { OpenDataDkSharingController } from "@admin-controller/open-data-dk-sharing.controller";
import { OpenDataDkSharingService } from "@services/data-management/open-data-dk-sharing.service";

@Module({
    controllers: [OpenDataDkSharingController],
    providers: [OpenDataDkSharingService],
})
export class OpenDataDkSharingModule {}
