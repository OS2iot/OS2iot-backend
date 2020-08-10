import { Injectable, OnModuleInit, Logger, HttpStatus } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { CreateNetworkServerDto } from "@dto/chirpstack/create-network-server.dto";
import { ListAllNetworkServerReponseDto } from "@dto/chirpstack/list-all-network-server-response.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { NetworkServerDto } from "@dto/chirpstack/network-server.dto";
const endpoint = "network-servers";

@Injectable()
export class ChirpstackSetupNetworkServerService
    extends GenericChirpstackConfigurationService
    implements OnModuleInit {
    async onModuleInit(): Promise<void> {
        await this.bootstrapChirpstackNetworkServerConfiguration();
    }

    async bootstrapChirpstackNetworkServerConfiguration(): Promise<void> {
        if ((await this.getNetworkServerCount()) < 1) {
            try {
                this.postNetworkServer(this.setupNetworkServerData());
            } catch (error) {
                Logger.error(error);
            }
        }
    }

    public async postNetworkServer(
        data: CreateNetworkServerDto
    ): Promise<void> {
        await this.post("network-servers", data);
    }
    public async putNetworkServer(
        data: CreateNetworkServerDto,
        id: number
    ): Promise<void> {
        await this.put("network-servers", data, id.toString());
    }
    public async deleteNetworkServer(id: number): Promise<DeleteResponseDto> {
        return await this.delete("network-servers", id.toString());
    }
    public async getNetworkServers(
        limit?: number,
        offset?: number
    ): Promise<ListAllNetworkServerReponseDto> {
        const result: ListAllNetworkServerReponseDto = await this.findAndCountAllWithPagination(
            endpoint,
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
        return result.totalCount;
    }

    setupNetworkServerData(): CreateNetworkServerDto {
        const networkServerDto: NetworkServerDto = {
            name: "OS2iot",
            server: this.networkServer,
        };
        const createNetworkServerDto: CreateNetworkServerDto = {
            networkServer: networkServerDto,
        };

        return createNetworkServerDto;
    }
}
