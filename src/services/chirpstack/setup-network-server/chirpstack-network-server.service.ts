import { Injectable, OnModuleInit } from "@nestjs/common";

import { GenericChirpstackConfigurationService } from "../generic-chirpstack-configuration/generic-chirpstack-configuration.service";
import { CreateNetworkServerDto } from "@dto/create-network-server.dto";

@Injectable()
export class ChirpstackSetupNetworkServerService
    extends GenericChirpstackConfigurationService
    implements OnModuleInit {
    async onModuleInit(): Promise<void> {
        const chirpstackNetworkServerName =
            "os2iot-docker_chirpstack-network-server_1:8000";
        const endpoint = "network-servers";
        const createNetworkServerDto: CreateNetworkServerDto = {
            name: chirpstackNetworkServerName,
            server: chirpstackNetworkServerName,

            caCert: "",
            gatewayDiscoveryDR: 0,
            gatewayDiscoveryEnabled: false,
            gatewayDiscoveryInterval: 0,
            gatewayDiscoveryTXFrequency: 0,
            routingProfileCACert: "",
            routingProfileTLSCert: "",
            routingProfileTLSKey: "",
            tlsCert: "",
            tlsKey: "",
        };
        const data: string = //TODO: skriv om til at bruge en DTO
            '{"networkServer":' + JSON.stringify(createNetworkServerDto) + "}";

        if ((await this.getCount(endpoint)) < 1) {
            this.post(endpoint, data); //Måske er det i virkeligheden ligegyldigt om den findes i forvejen. ??
        }
    }
}
