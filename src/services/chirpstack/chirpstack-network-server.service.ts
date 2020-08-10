import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { CreateNetworkServerDto } from "@dto/chirpstack/create-network-server.dto";
import { ListAllNetworkServerReponseDto } from "@dto/chirpstack/list-all-network-server-response.dto";
import { UpdateNetworkServerDto } from "@dto/chirpstack/update-network-server.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { NetworkServerDto } from "@dto/chirpstack/network-server.dto";

@Injectable()
export class ChirpstackSetupNetworkServerService
    extends GenericChirpstackConfigurationService
    implements OnModuleInit {
    async onModuleInit(): Promise<void> {
        if ((await this.getNetworkServerCount()) < 1) {
            this.postNetworkServer(this.setupData());
        }
    }

    public async postNetworkServer(
        data: CreateNetworkServerDto
    ): Promise<CreateNetworkServerDto> {
        return await this.post("network-servers", data);
    }
    public async putNetworkServer(
        data: CreateNetworkServerDto,
        id: number
    ): Promise<UpdateNetworkServerDto> {
        return await this.put("network-servers", data, id);
    }
    public async deleteNetworkServer(id: number): Promise<DeleteResponseDto> {
        Logger.error("Delete " + id);
        return await this.delete("network-servers", id);
    }
    public async getNetworkServers(
        limit?: number,
        offset?: number
    ): Promise<ListAllNetworkServerReponseDto> {
        const result: ListAllNetworkServerReponseDto = await this.getAll(
            "network-servers",
            limit,
            offset
        );
        return result;
    }
    public async getNetworkServerCount(): Promise<number> {
        const result: ListAllNetworkServerReponseDto = await this.getNetworkServers(
            0,
            1000
        );
        Logger.log("result.totalCount;" + result.totalCount);
        return result.totalCount;
    }

    setupData(): CreateNetworkServerDto {
        const networkServerDto: NetworkServerDto = {
            name: "OS2iot",
            server: this.networkServer,
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
        const createNetworkServerDto: CreateNetworkServerDto = {
            networkServer: networkServerDto,
        };

        return createNetworkServerDto;
    }
}
