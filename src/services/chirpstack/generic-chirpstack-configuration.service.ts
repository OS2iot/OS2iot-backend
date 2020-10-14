import {
    BadRequestException,
    HttpService,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { AxiosRequestConfig, AxiosResponse } from "axios";

import { HeaderDto } from "@dto/chirpstack/header.dto";
import { ListAllNetworkServerReponseDto } from "@dto/chirpstack/list-all-network-server-response.dto";
import { ListAllOrganizationsReponseDto } from "@dto/chirpstack/list-all-organizations-response.dto";
import { AuthorizationType } from "@enum/authorization-type.enum";
import { ErrorCodes } from "@enum/error-codes.enum";

import { JwtToken } from "./jwt-token";

@Injectable()
export class GenericChirpstackConfigurationService {
    baseUrl = `http://${
        process.env.CHIRPSTACK_APPLICATION_SERVER_HOSTNAME || "host.docker.internal"
    }:${process.env.CHIRPSTACK_APPLICATION_SERVER_PORT || "8080"}`;

    networkServer = `${
        process.env.CHIRPSTACK_NETWORK_SERVER || "chirpstack-network-server"
    }:${process.env.CHIRPSTACK_NETWORK_SERVER_PORT || "8000"}`;
    constructor(private httpService: HttpService) {}

    setupHeader(endPoint: string, limit?: number, offset?: number): HeaderDto {
        if (limit != null && offset != null) {
            const headerDto: HeaderDto = {
                url: `${this.baseUrl}/api/${endPoint}?limit=${limit}&offset=${offset}`,
                timeout: 3000,
                authorizationType: AuthorizationType.HEADER_BASED_AUTHORIZATION,
                authorizationHeader: "Bearer " + JwtToken.setupToken(),
            };
            return headerDto;
        }
        const headerDto: HeaderDto = {
            url: this.baseUrl + "/api/" + endPoint,
            timeout: 3000,
            authorizationType: AuthorizationType.HEADER_BASED_AUTHORIZATION,
            authorizationHeader: "Bearer " + JwtToken.setupToken(),
        };

        return headerDto;
    }

    makeAxiosConfiguration(config: {
        timeout: number;
        authorizationHeader: string;
    }): AxiosRequestConfig {
        const axiosConfig: AxiosRequestConfig = {
            timeout: config.timeout,
            headers: { "Content-Type": "application/json" },
        };

        axiosConfig.headers["Authorization"] = config.authorizationHeader;

        return axiosConfig;
    }

    async post<T>(endpoint: string, data: T): Promise<AxiosResponse> {
        const header = this.setupHeader(endpoint);
        const axiosConfig = this.makeAxiosConfiguration(header);

        try {
            const result = await this.httpService
                .post(header.url, data, axiosConfig)
                .toPromise();

            Logger.debug(
                `post: ${JSON.stringify(
                    data
                )} to  ${endpoint} resulting in ${result.status.toString()} and message: ${
                    result.statusText
                }`
            );

            return result;
        } catch (err) {
            Logger.error(`post got error: ${JSON.stringify(err?.response?.data)}`);

            this.throwBadRequestIf400(err);

            throw err;
        }
    }

    private throwBadRequestIf400(err: any) {
        if (err?.response?.status == 400) {
            throw new BadRequestException({
                success: false,
                chirpstackError: err?.response?.data,
            });
        }
    }

    async put<T>(endpoint: string, data: T, id: string): Promise<AxiosResponse> {
        const header = this.setupHeader(endpoint);
        const axiosConfig = this.makeAxiosConfiguration(header);
        const url = header.url + "/" + id;
        try {
            const result = await this.httpService.put(url, data, axiosConfig).toPromise();

            Logger.debug(
                `put: ${JSON.stringify(
                    data
                )} to ${endpoint} resulting in ${result.status.toString()} and message: ${
                    result.statusText
                }`
            );

            return result;
        } catch (err) {
            this.throwBadRequestIf400(err);
            Logger.error(`Put got error: `);
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    async getOneById<T>(endpoint: string, id: string): Promise<T> {
        const header = this.setupHeader(endpoint);
        const axiosConfig = this.makeAxiosConfiguration(header);
        try {
            const url = header.url + "/" + id;
            const result = await this.httpService.get(url, axiosConfig).toPromise();

            Logger.debug(
                `get by ID from:${endpoint} resulting in ${result.status.toString()} and message: ${
                    result.statusText
                }`
            );

            return result.data;
        } catch (err) {
            Logger.error(`get got error: ${JSON.stringify(err?.response)}`);
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    async delete<T>(endpoint: string, id?: string): Promise<AxiosResponse> {
        const header = this.setupHeader(endpoint);
        const axiosConfig = this.makeAxiosConfiguration(header);
        try {
            const url = header.url + (id != undefined ? "/" + id : "");
            const result = await this.httpService.delete(url, axiosConfig).toPromise();

            Logger.debug(
                `delete : ${result.status.toString()} and message: ${result.statusText}`
            );
            return result;
        } catch (err) {
            Logger.error(`Delete got error: ${JSON.stringify(err?.response?.data)}`);
            throw new InternalServerErrorException(err?.response?.data);
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        const header = this.setupHeader(endpoint);
        const axiosConfig = this.makeAxiosConfiguration(header);

        try {
            const result = await this.httpService
                .get(header.url, axiosConfig)
                .toPromise();

            return result.data;
        } catch (err) {
            Logger.error(`Error from Chirpstack ${JSON.stringify(err?.response?.data)}`);
            if (err?.response?.status == 404) {
                throw new NotFoundException(err?.response?.data);
            }

            throw new InternalServerErrorException(err?.response?.data);
        }
    }

    async getAllWithPagination<T>(
        endpoint: string,
        limit?: number,
        offset?: number
    ): Promise<T> {
        const header = this.setupHeader(endpoint, limit, offset);
        const axiosConfig = this.makeAxiosConfiguration(header);

        try {
            const result = await this.httpService
                .get(header.url, axiosConfig)
                .toPromise();
            Logger.debug(
                `get all from:${endpoint} resulting in ${result.status.toString()} and message: ${
                    result.statusText
                }`
            );
            return result.data;
        } catch (err) {
            Logger.error(`GET ${header.url} got error: ${err}`);
            throw new NotFoundException();
        }
    }

    public async getNetworkServers(
        limit?: number,
        offset?: number
    ): Promise<ListAllNetworkServerReponseDto> {
        const res = await this.getAllWithPagination<ListAllNetworkServerReponseDto>(
            "network-servers",
            limit,
            offset
        );
        return res;
    }

    public async getOrganizations(
        limit?: number,
        offset?: number
    ): Promise<ListAllOrganizationsReponseDto> {
        const res = await this.getAllWithPagination<ListAllOrganizationsReponseDto>(
            "organizations",
            limit,
            offset
        );
        return res;
    }

    public async getDefaultNetworkServerId(): Promise<string> {
        let id = null;
        await this.getNetworkServers(1000, 0).then(response => {
            response.result.forEach(element => {
                if (element.name.toLowerCase() === "os2iot") {
                    id = element.id.toString();
                }
            });
        });
        if (id) {
            return id;
        }
        throw new InternalServerErrorException(
            "Could not find any NetworkServer in Chirpstack named: 'OS2iot'"
        );
    }

    public async getDefaultOrganizationId(): Promise<string> {
        let id = null;
        await this.getOrganizations(1000, 0).then(response => {
            response.result.forEach(element => {
                if (
                    element.name.toLowerCase() == "os2iot" ||
                    element.name.toLowerCase() == "chirpstack"
                ) {
                    id = element.id;
                }
            });
        });
        if (id) {
            return id;
        }
        throw new InternalServerErrorException(
            "Could not find any Organization in Chirpstack named: 'OS2iot' or 'chirpstack'"
        );
    }
}
