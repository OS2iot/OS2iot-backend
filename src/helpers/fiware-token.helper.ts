import { CACHE_MANAGER, HttpService, Inject, Injectable, Logger } from "@nestjs/common"
import { Cache } from 'cache-manager'
import { FiwareDataTargetConfiguration } from "../entities/interfaces/fiware-data-target-configuration.interface";

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
        const key = config.clientId + config.clientSecret;
        const token = await this.cacheManager.get<string>(key)
        if (token) {
            this.logger.debug('Token found')
            return token
        } else {
            try {
                const encodedCredentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
                const params = new URLSearchParams([['grant_type', 'client_credentials']])
                const { data }: { data: TokenEndpointResponse } = await this.httpService.post(config.tokenEndpoint, params, {
                    headers: {
                        'Authorization': `Basic ${encodedCredentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }).toPromise()

                const clockSkew = 30
                const ttl = data.expires_in - clockSkew
                this.logger.debug(`AuthenticationTokenProvider caching token for ${config.clientId} (expires in ${ttl} seconds)`)
                this.cacheManager.set(key, data.access_token, { ttl })
                return data.access_token
            }
            catch (err) {
                this.logger.error(`AuthenticationTokenProvider got error ${err}`)
            }
        }
    }
}
