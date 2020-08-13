import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { CreateNetworkServerDto } from "@dto/chirpstack/create-network-server.dto";
import { ListAllNetworkServerReponseDto } from "@dto/chirpstack/list-all-network-server-response.dto";
import { NetworkServerDto } from "@dto/chirpstack/network-server.dto";
import { AxiosResponse } from "axios";

@Injectable()
export class ChirpstackSetupNetworkServerService
    extends GenericChirpstackConfigurationService
    implements OnModuleInit {
    async onModuleInit(): Promise<void> {
        await this.bootstrapChirpstackNetworkServerConfiguration();
    }

    public async bootstrapChirpstackNetworkServerConfiguration(): Promise<
        AxiosResponse
    > {
        if ((await this.getNetworkServerCount()) < 1) {
            try {
                return this.postNetworkServer(this.setupNetworkServerData());
            } catch (error) {
                Logger.error(error);
            }
        }
    }

    public async postNetworkServer(
        data: CreateNetworkServerDto
    ): Promise<AxiosResponse> {
        return await this.post("network-servers", data);
    }

    public async putNetworkServer(
        data: CreateNetworkServerDto,
        id: number
    ): Promise<AxiosResponse> {
        return await this.put("network-servers", data, id.toString());
    }
    public async deleteNetworkServer(id: number): Promise<AxiosResponse> {
        return await this.delete("network-servers", id.toString());
    }

    public async getNetworkServers(
        limit?: number,
        offset?: number
    ): Promise<ListAllNetworkServerReponseDto> {
        const res = await this.getAllWithPagination<
            ListAllNetworkServerReponseDto
        >("network-servers", limit, offset);
        return res;
    }
    public async getNetworkServerCount(): Promise<number> {
        const result: ListAllNetworkServerReponseDto = await this.getNetworkServers(
            0,
            1000
        );
        return result.totalCount;
    }

    public setupNetworkServerData(): CreateNetworkServerDto {
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
