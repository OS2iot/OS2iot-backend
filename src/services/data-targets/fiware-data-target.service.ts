import { HttpService, Injectable, Logger } from "@nestjs/common";
import { AxiosRequestConfig } from "axios";

import { AuthorizationType } from "@enum/authorization-type.enum";
import { DataTarget } from "@entities/data-target.entity";
import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { FiwareDataTargetConfiguration } from "@interfaces/fiware-data-target-configuration.interface";
import { BaseDataTargetService } from "@services/data-targets/base-data-target.service";

@Injectable()
export class FiwareDataTargetService extends BaseDataTargetService {
    constructor(private httpService: HttpService) {
        super();
    }

    protected readonly logger = new Logger(FiwareDataTargetService.name);

    // eslint-disable-next-line max-lines-per-function
    async send(
        datatarget: DataTarget,
        dto: TransformedPayloadDto
    ): Promise<DataTargetSendStatus> {
        
        const config: FiwareDataTargetConfiguration = (datatarget as FiwareDataTarget).toConfiguration();

      
        // Setup HTTP client
        const axiosConfig = this.makeAxiosConfiguration(config);

        const rawBody: string = JSON.stringify(dto.payload);      

        const endpointUrl = `${config.url}/ngsi-ld/v1/entityOperations/upsert/`;
        const target = `FiwareDataTarget(${endpointUrl})`;

        try {
            const result = await this.httpService
                .post(endpointUrl, rawBody, axiosConfig)
                .toPromise();

            this.logger.debug(
                `FiwareDataTarget result: '${JSON.stringify(result.data)}'`
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
            this.logger.error(`FiwareDataTarget got error: ${err}`);
            return this.failure(target, err);
        }
    }

     makeAxiosConfiguration(
        config: FiwareDataTargetConfiguration
    ): AxiosRequestConfig {
        
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
            }
        }
        return axiosConfig;
    }

    getHeaders(config: FiwareDataTargetConfiguration) :any
    {
        let headers :any = {}
        
        if(config.context) {
            headers = {               
                    "Content-Type": "application/json",
                    Link: `<${config.context}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
            };
        } else {
            headers =  {
                "Content-Type": "application/ld+json",                
            };
        }

        if (config.tenant)
        {
            headers["NGSILD-Tenant"] = config.tenant;
        }

        return headers;
    }
}
