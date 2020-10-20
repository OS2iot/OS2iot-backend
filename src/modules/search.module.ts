import { SearchController } from "@admin-controller/search.controller";
import { Module } from "@nestjs/common";
import { SearchService } from "@services/data-management/search.service";
import { ChirpstackAdministrationModule } from "./device-integrations/chirpstack-administration.module";

@Module({
    imports: [ChirpstackAdministrationModule],
    providers: [SearchService],
    controllers: [SearchController],
})
export class SearchModule {}
