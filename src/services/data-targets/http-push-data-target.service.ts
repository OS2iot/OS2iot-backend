import { HttpService, Injectable, Logger } from "@nestjs/common";
import { AxiosRequestConfig } from "axios";

import { AuthorizationType } from "@enum/authorization-type.enum";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { HttpPushDataTargetConfiguration } from "@interfaces/http-push-data-target-configuration.interface";
import { HttpPushDataTargetData } from "@interfaces/http-push-data-target-data.interface";
import { BaseDataTargetService } from "@services/data-targets/base-data-target.service";

@Injectable()
export class HttpPushDataTargetService extends BaseDataTargetService {
    constructor(private httpService: HttpService) {
        super();
    }

    protected readonly logger = new Logger(HttpPushDataTargetService.name);

    // eslint-disable-next-line max-lines-per-function
    async send(
        config: HttpPushDataTargetConfiguration,
        data: HttpPushDataTargetData
    ): Promise<DataTargetSendStatus> {
        // Setup HTTP client
        const axiosConfig = HttpPushDataTargetService.makeAxiosConfiguration(
            config,
            data
        );
        const target = `HttpTarget(${config.url})`;

        try {
            const result = await this.httpService
                .post(config.url, data.rawBody, axiosConfig)
                .toPromise();

            this.logger.debug(
                `HttpPushDataTarget result: '${JSON.stringify(result.data)}'`
            );
            if (!result.status.toString().startsWith("2")) {
                this.logger.warn(
                    `Got a non-2xx status-code: ${result.status.toString()} and message: ${
                        result.statusText
                    }`
                );
            }
            return this.success(target);
        } catch (err) {
            // TODO: Error handling for common errors
            this.logger.error(`HttpPushDataTarget got error: ${err}`);
            return this.failure(target, err);
        }
    }

    static makeAxiosConfiguration(
        config: HttpPushDataTargetConfiguration,
        data: HttpPushDataTargetData
    ): AxiosRequestConfig {
        const axiosConfig: AxiosRequestConfig = {
            timeout: config.timeout,
            headers: { "Content-Type": data.mimeType },
        };
        if (
            config.authorizationType !== null &&
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
            }
        }
        return axiosConfig;
    }
}
