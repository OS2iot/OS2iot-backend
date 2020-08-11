import { Module, HttpModule } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/chirpstack-network-server.service";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { ChirpstackGatewayController } from "@admin-controller/chirpstack/chirpstack-gateway.controller";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";

@Module({
    controllers: [ChirpstackGatewayController],
    imports: [HttpModule],
    providers: [
        ChirpstackSetupNetworkServerService,
        GenericChirpstackConfigurationService,
        ChirpstackGatewayService,
    ],
})
export class ChirpstackAdministrationModule {}
