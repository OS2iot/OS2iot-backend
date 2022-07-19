import { HttpService, Injectable, Logger, Inject, CACHE_MANAGER } from "@nestjs/common";
import { Cache } from 'cache-manager'
import { AxiosRequestConfig } from "axios";

import { AuthorizationType } from "@enum/authorization-type.enum";
import { DataTarget } from "@entities/data-target.entity";
import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { FiwareDataTargetConfiguration } from "@interfaces/fiware-data-target-configuration.interface";
import { BaseDataTargetService } from "@services/data-targets/base-data-target.service";

type TokenEndpointResponse = {
    access_token: string,
    expires_in: number,
}

@Injectable()
export class AuthenticationTokenProvider {

    private readonly logger = new Logger(AuthenticationTokenProvider.name);

    constructor(private httpService: HttpService, @Inject(CACHE_MANAGER) private cacheManager: Cache) {
    }

    async getToken(config: FiwareDataTargetConfiguration): Promise<string> {
        const token = await this.cacheManager.get<string>(config.clientId)
        if (token) {
            this.logger.debug('Token found')
            return token
        } else {
            try {
                const buffer = Buffer.from(`${config.clientId}:${config.clientSecret}`);
                const encodedCredentials = buffer.toString('base64');
                const params = new URLSearchParams([['grant_type', 'client_credentials']])
                const { data }: { data: TokenEndpointResponse } = await this.httpService.post(config.tokenEndpoint, params, {
                    headers: {
                        'Authorization': `Basic ${encodedCredentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }).toPromise()

                const clockSkew = 300
                this.logger.debug(`AuthenticationTokenProvider caching token for ${config.clientId} (expires in ${data.expires_in} seconds)`)
                this.cacheManager.set(config.clientId, data.access_token, { ttl: data.expires_in - clockSkew })
                return data.access_token
            }
            catch (err) {
                this.logger.error(`AuthenticationTokenProvider got error ${err}`)
            }
        }
    }
}

@Injectable()
export class FiwareDataTargetService extends BaseDataTargetService {
    constructor(private httpService: HttpService, private authenticationTokenProvider: AuthenticationTokenProvider) {
        super();
    }

    protected readonly logger = new Logger(FiwareDataTargetService.name);

    // eslint-disable-next-line max-lines-per-function
    async send(
        datatarget: DataTarget,
        dto: TransformedPayloadDto
    ): Promise<DataTargetSendStatus> {

        const config: FiwareDataTargetConfiguration = (datatarget as FiwareDataTarget).toConfiguration();

        const endpointUrl = `${config.url}/ngsi-ld/v1/entityOperations/upsert/`;
        const target = `FiwareDataTarget(${endpointUrl})`;

        try {
            // Setup HTTP client
            const axiosConfig = await this.makeAxiosConfiguration(config);

            const rawBody: string = JSON.stringify(dto.payload);
            const result = await this.httpService
                .post(endpointUrl, rawBody, axiosConfig)
                .toPromise();

            this.logger.debug(
                `FiwareDataTarget result: '${JSON.stringify(result.data)}'`
            );
            if (!result.status.toString().startsWith("2")) {
                this.logger.warn(
                    `Got a non-2xx status-code: ${result.status.toString()} and message: ${result.statusText
                    }`
                );
            }
            return this.success(target);
        } catch (err) {
            this.logger.error(`FiwareDataTarget got error: ${err}`);
            return this.failure(target, err);
        }
    }

    async makeAxiosConfiguration(
        config: FiwareDataTargetConfiguration
    ): Promise<AxiosRequestConfig> {

        const axiosConfig: AxiosRequestConfig = {
            timeout: config.timeout,
            headers: this.getHeaders(config),
        };

        if (config.authorizationType !== null &&
            config.authorizationType !== AuthorizationType.NO_AUTHORIZATION
        ) {
            if (config.authorizationType === AuthorizationType.HTTP_BASIC_AUTHORIZATION) {
                axiosConfig.auth = {
                    username: config.username,
                    password: config.password,
                };
            } else if (
                config.authorizationType === AuthorizationType.HEADER_BASED_AUTHORIZATION
            ) {
                axiosConfig.headers["Authorization"] = config.authorizationHeader;
            } else if (
                config.authorizationType === AuthorizationType.OAUTH_AUTHORIZATION
            ) {
                const token = await this.authenticationTokenProvider.getToken(config)
                axiosConfig.headers["Authorization"] = `Bearer ${token}`;
            }
        }
        return axiosConfig;
    }

    getHeaders(config: FiwareDataTargetConfiguration): any {
        let headers: any = {}

        if (config.context) {
            headers = {
                "Content-Type": "application/json",
                Link: `<${config.context}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
            };
        } else {
            headers = {
                "Content-Type": "application/ld+json",
            };
        }

        if (config.tenant) {
            headers["NGSILD-Tenant"] = config.tenant;
        }

        return headers;
    }
}
