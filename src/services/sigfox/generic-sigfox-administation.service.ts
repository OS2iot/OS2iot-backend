import {
    SigFoxApiContractInfosContent,
    SigFoxApiContractInfosResponseDto,
} from "@dto/sigfox/external/sigfox-api-contract-infos-response.dto";
import { SigFoxApiUsersResponseDto } from "@dto/sigfox/external/sigfox-api-groups-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    BadRequestException,
    HttpService,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { AxiosRequestConfig, Method } from "axios";

@Injectable()
export class GenericSigfoxAdministationService {
    constructor(private httpService: HttpService) {}

    BASE_URL = "https://api.sigfox.com/v2/";
    TIMEOUT_IN_MS = 30000;

    private readonly logger = new Logger(GenericSigfoxAdministationService.name);

    async get<T>(path: string, sigfoxGroup: SigFoxGroup): Promise<T> {
        return await this.doRequest<T>(path, sigfoxGroup, "GET");
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async post<T>(path: string, dto: any, sigfoxGroup: SigFoxGroup): Promise<T> {
        return await this.doRequest<T>(path, sigfoxGroup, "POST", dto);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async put<T>(path: string, dto: any, sigfoxGroup: SigFoxGroup): Promise<T> {
        return await this.doRequest<T>(path, sigfoxGroup, "PUT", dto);
    }

    async delete<T>(path: string, sigfoxGroup: SigFoxGroup): Promise<T> {
        return await this.doRequest<T>(path, sigfoxGroup, "DELETE");
    }

    async getContractInfos(
        sigfoxGroup: SigFoxGroup
    ): Promise<SigFoxApiContractInfosContent[]> {
        const res = await this.get<SigFoxApiContractInfosResponseDto>(
            "contract-infos",
            sigfoxGroup
        );

        return res.data;
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

    private async doRequest<T>(
        path: string,
        sigfoxGroup: SigFoxGroup,
        method: Method,
        dto?: any
    ): Promise<T> {
        const config = await this.generateAxiosConfig(sigfoxGroup, method, path, dto);
        try {
            const result = await this.httpService.request(config).toPromise();
            this.logger.debug(
                `${method} '${path}' got status: '${result.status} ${result.statusText}' `
            );
            return result.data;
        } catch (err) {
            this.logger.warn(
                `${method} '${path}'` + (dto != null ? `: '${JSON.stringify(dto)}'` : "")
            );
            const response = err?.response;
            if (response?.status == 401) {
                throw new UnauthorizedException(ErrorCodes.SIGFOX_BAD_LOGIN);
            }

            if (response?.status == 400) {
                throw new BadRequestException(response?.data);
            }

            this.logger.error(
                `Got unexpected error from SigFox (${response?.status} ${response?.statusText})'`
            );
            throw err;
        }
    }

    private async generateAxiosConfig(
        sigfoxGroup: SigFoxGroup,
        method: Method,
        path: string,
        dto?: any
    ): Promise<AxiosRequestConfig> {
        const url = this.generateUrl(path);
        const axiosConfig: AxiosRequestConfig = {
            timeout: this.TIMEOUT_IN_MS,
            headers: { "Content-Type": "application/json" },
            auth: {
                username: sigfoxGroup.username,
                password: sigfoxGroup.password,
            },
            method: method,
            url: url,
        };
        if (dto) {
            axiosConfig.data = dto;
        }

        return axiosConfig;
    }

    private generateUrl(path: string): string {
        return `${this.BASE_URL}${path}`;
    }
}
