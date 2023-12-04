import { LoRaWANGatewayController } from "@admin-controller/lorawan/lorawan-gateway.controller";
import { SharedModule } from "@modules/shared.module";
import { Module } from "@nestjs/common";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { GatewayStatusHistoryService } from "@services/chirpstack/gateway-status-history.service";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { GatewayBootstrapperService } from "@services/chirpstack/gateway-boostrapper.service";
import { HttpModule } from "@nestjs/axios";
import { OrganizationModule } from "@modules/user-management/organization.module";

@Module({
    controllers: [LoRaWANGatewayController],
    imports: [SharedModule, HttpModule, OrganizationModule],
    providers: [
        ChirpstackGatewayService,
        ChirpstackSetupNetworkServerService,
        GatewayStatusHistoryService,
        GatewayBootstrapperService,
    ],
    exports: [GatewayStatusHistoryService],
})
export class LoRaWANGatewayModule {}
