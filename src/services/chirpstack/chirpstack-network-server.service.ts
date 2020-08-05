import { Injectable, OnModuleInit } from "@nestjs/common";

import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { CreateNetworkServerDto } from "@dto/create-network-server.dto";

@Injectable()
export class ChirpstackSetupNetworkServerService
    extends GenericChirpstackConfigurationService
    implements OnModuleInit {
    async onModuleInit(): Promise<void> {
        if ((await this.getNetworkServerCount()) < 1) {
            this.postNetworkServer(this.setupData()); //Måske er det i virkeligheden ligegyldigt om den findes i forvejen. ??
        }
    }

    public async postNetworkServer(data: string): Promise<JSON> {
        return await this.post("network-servers", data);
    }
    public async putNetworkServer(data: string, id: number): Promise<JSON> {
        return await this.put("network-servers", data, id);
    }
    public async deleteNetworkServer(id: number): Promise<JSON> {
        return await this.get("network-servers", id);
    }
    public async getNetworkServer(
        limit?: number,
        offset?: number
    ): Promise<JSON> {
        return await this.get("network-servers", limit, offset);
    }
    public async getNetworkServerCount(): Promise<number> {
        return await this.getCount("network-servers");
    }

    setupData(): string {
        const chirpstackNetworkServerName =
            "os2iot-docker_chirpstack-network-server_1:8000";

        const createNetworkServerDto: CreateNetworkServerDto = {
            name: chirpstackNetworkServerName,
            server: chirpstackNetworkServerName,
            /*
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
            */
        };
        const data: string = //TODO: skriv om til at bruge en DTO
            '{"networkServer":' + JSON.stringify(createNetworkServerDto) + "}";

        return data;
    }
}
