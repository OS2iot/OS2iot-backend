import { SearchController } from "@admin-controller/search.controller";
import { Module } from "@nestjs/common";
import { SearchService } from "@services/data-management/search.service";
import { ChirpstackAdministrationModule } from "./device-integrations/chirpstack-administration.module";
import { SharedModule } from "./shared.module";

@Module({
    imports: [ChirpstackAdministrationModule, SharedModule],
    providers: [SearchService],
    controllers: [SearchController],
})
export class SearchModule {}
