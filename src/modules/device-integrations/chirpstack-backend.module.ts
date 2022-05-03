import { SharedModule } from "@modules/shared.module";
import { Module } from "@nestjs/common";
import { ChirpstackOnlineHistoryService } from "@services/chirpstack/chirpstack-online-history.service";
import { GatewayBackendController } from "@admin-controller/chirpstack/gateway-backend.controller";

@Module({
    controllers: [GatewayBackendController],
    imports: [SharedModule],
    providers: [ChirpstackOnlineHistoryService],
    exports: [ChirpstackOnlineHistoryService],
})
export class ChirpstackBackendModule {}
