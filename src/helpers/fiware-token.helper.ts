import { HttpService } from "@nestjs/axios";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { FiwareDataTargetConfiguration } from "../entities/interfaces/fiware-data-target-configuration.interface";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";

type TokenEndpointResponse = {
  data: {
    access_token: string;
    expires_in: number;
  };
};

export const CLIENT_SECRET_PROVIDER = "ClientSecretProvider";
export interface ClientSecretProvider {
  getClientSecret(secretRef: string): Promise<string>;
  store(secret: string): Promise<string>;
}

@Injectable()
export class PlainTextClientSecretProvider implements ClientSecretProvider {
  getClientSecret(secretRef: string): Promise<string> {
    return Promise.resolve(secretRef);
  }

  store(secret: string): Promise<string> {
    return Promise.resolve(secret);
  }
}

@Injectable()
export class AuthenticationTokenProvider {
  private readonly logger = new Logger(AuthenticationTokenProvider.name);

  constructor(
    private httpService: HttpService,
    @Inject(CLIENT_SECRET_PROVIDER)
    private clientSecretProvider: ClientSecretProvider,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async clearConfig(config: FiwareDataTargetConfiguration): Promise<boolean> {
    if (config.clientId) {
      this.logger.debug(`AuthenticationTokenProvider clearing token for ${config.clientId}`);
      const key = config.clientId + config.updatedAt.getTime();
      return this.cacheManager.del(key);
    }
  }

  async getToken(config: FiwareDataTargetConfiguration): Promise<string> {
    const key = config.clientId + config.updatedAt.getTime();

    const token = await this.cacheManager.get<string>(key);
    if (token) {
      return token;
    } else {
      try {
        const clientSecret = await this.clientSecretProvider.getClientSecret(config.clientSecret);
        const params = new URLSearchParams([
          ["grant_type", "client_credentials"],
          ["client_id", config.clientId],
          ["client_secret", clientSecret],
        ]);
        const { data }: TokenEndpointResponse = await this.httpService
          .post(config.tokenEndpoint, params, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          })
          .toPromise();

        // NOTE: TTL offset include some time for clock differences between authentication server and local server + network delay
        const ttlOffset = 30;
        const ttl = data.expires_in - ttlOffset;
        this.logger.debug(
          `AuthenticationTokenProvider caching token for ${config.clientId} (expires in ${ttl} seconds)`
        );
        await this.cacheManager.set(key, data.access_token, ttl);
        return data.access_token;
      } catch (err) {
        this.logger.error(`AuthenticationTokenProvider got error ${err}`);
        throw err;
      }
    }
  }
}
