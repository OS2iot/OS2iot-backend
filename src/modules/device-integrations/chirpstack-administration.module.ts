import { Module, HttpModule } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { ChirpstackGatewayController } from "@admin-controller/chirpstack/chirpstack-gateway.controller";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { ServiceProfileController } from "@admin-controller/chirpstack/service-profile.controller";
import { ServiceProfileService } from "@services/chirpstack/service-profile.service";

@Module({
    controllers: [ChirpstackGatewayController, ServiceProfileController],
    imports: [HttpModule],
    providers: [
        ChirpstackSetupNetworkServerService,
        GenericChirpstackConfigurationService,
        ChirpstackGatewayService,
        ServiceProfileService,
    ],
})
export class ChirpstackAdministrationModule {}
