import { Module, HttpModule } from "@nestjs/common";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/chirpstack-network-server.service";
@Module({
    controllers: [],
    imports: [HttpModule],
    providers: [ChirpstackSetupNetworkServerService],
})
export class ChirpstackAdministrationModule {}
