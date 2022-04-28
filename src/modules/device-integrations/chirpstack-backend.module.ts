import { SharedModule } from "@modules/shared.module";
import { Module } from "@nestjs/common";
import { ChirpstackOnlineHistoryService } from "@services/chirpstack/chirpstack-online-history.service";

@Module({
    imports: [SharedModule],
    providers: [ChirpstackOnlineHistoryService],
    exports: [ChirpstackOnlineHistoryService],
})
export class ChirpstackBackendModule {}
