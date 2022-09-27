import { HttpService, Injectable, Logger } from "@nestjs/common";
import { AxiosRequestConfig } from "axios";

import { AuthorizationType } from "@enum/authorization-type.enum";
import { DataTarget } from "@entities/data-target.entity";
import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { FiwareDataTargetConfiguration } from "@interfaces/fiware-data-target-configuration.interface";
import { BaseDataTargetService } from "@services/data-targets/base-data-target.service";
import { AuthenticationTokenProvider } from "../../helpers/fiware-token.helper";
import { SendStatus } from "../../entities/enum/send-status.enum";

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

        // NOTE: For context broker secured with OAuth2 we want to have extra retry in case the cached token is expired.
        const retries = config.tokenEndpoint ? 1 : 0

        return this.retry(async () => {
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
                this.authenticationTokenProvider.clearConfig(config);
                return this.failure(target, err);
            }
        }, retries)
    }

    async retry(action: () => Promise<DataTargetSendStatus>, retries: number): Promise<DataTargetSendStatus> {
        do {
            const result = await action()
            if (result.status === SendStatus.ERROR && retries > 0) {
                this.logger.warn('Sending request to Fiware failed. Retrying...')
                retries--;
                continue
            } else {
                return result
            }
        }
        while (true)
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
