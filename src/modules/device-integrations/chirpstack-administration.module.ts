import { Module, HttpModule } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/chirpstack-network-server.service";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
@Module({
    controllers: [],
    imports: [HttpModule],
    providers: [
        ChirpstackSetupNetworkServerService,
        GenericChirpstackConfigurationService,
    ],
})
export class ChirpstackAdministrationModule {}
