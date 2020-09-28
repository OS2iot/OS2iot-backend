import { HttpService, Injectable, Logger } from "@nestjs/common";
import { AxiosRequestConfig, AxiosResponse } from "axios";

@Injectable()
export class GenericSigfoxAdministationService {
    constructor(private httpService: HttpService) {}

    BASE_URL = "https://api.sigfox.com/v2/";
    TIMEOUT_IN_MS = 30000;

    private readonly logger = new Logger(GenericSigfoxAdministationService.name);

    async get<T>(path: string): Promise<T> {
        const url = this.generateUrl(path);
        const config = await this.generateAxiosConfig();

        this.logger.debug(`GET to '${path}'`);
        const result = await this.httpService.get(url, config).toPromise();
        this.logger.debug(
            `GET to '${path}' got status: '${result.status} ${result.statusText}'`
        );
        return await result.data;
    }

    private async generateAxiosConfig(
        organizationId?: number
    ): Promise<AxiosRequestConfig> {
        const axiosConfig: AxiosRequestConfig = {
            timeout: this.TIMEOUT_IN_MS,
            headers: { "Content-Type": "application/json" },
            auth: {
                username: "5f2d1069e833d903621ff237",
                password: "210104d1578b7a7b75f3eb2d0adf770f",
            },
        };

        return axiosConfig;
    }

    private generateUrl(path: string): string {
        return `${this.BASE_URL}${path}`;
    }
}
