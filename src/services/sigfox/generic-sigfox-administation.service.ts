import { SigFoxApiUsersResponseDto } from "@dto/sigfox/external/sigfox-api-groups-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { HttpService, Injectable, Logger } from "@nestjs/common";
import { AxiosRequestConfig } from "axios";

@Injectable()
export class GenericSigfoxAdministationService {
    constructor(private httpService: HttpService) {}

    BASE_URL = "https://api.sigfox.com/v2/";
    TIMEOUT_IN_MS = 30000;

    private readonly logger = new Logger(GenericSigfoxAdministationService.name);

    async get<T>(path: string, sigfoxGroup: SigFoxGroup): Promise<T> {
        const url = this.generateUrl(path);
        const config = await this.generateAxiosConfig(sigfoxGroup);

        this.logger.debug(`GET to '${path}'`);
        const result = await this.httpService.get(url, config).toPromise();
        this.logger.debug(
            `GET to '${path}' got status: '${result.status} ${result.statusText}'`
        );
        return await result.data;
    }

    async testConnection(sigfoxGroup: SigFoxGroup): Promise<boolean> {
        try {
            const apiUsers = await this.get<SigFoxApiUsersResponseDto>(
                "api-users",
                sigfoxGroup
            );
            return apiUsers.data.length > 0;
        } catch (err) {
            if (err?.response?.status === 401) {
                return false;
            }
        }
    }

    private async generateAxiosConfig(
        sigfoxGroup: SigFoxGroup
    ): Promise<AxiosRequestConfig> {
        const axiosConfig: AxiosRequestConfig = {
            timeout: this.TIMEOUT_IN_MS,
            headers: { "Content-Type": "application/json" },
            auth: {
                username: sigfoxGroup.username,
                password: sigfoxGroup.password,
            },
        };

        return axiosConfig;
    }

    private generateUrl(path: string): string {
        return `${this.BASE_URL}${path}`;
    }
}
