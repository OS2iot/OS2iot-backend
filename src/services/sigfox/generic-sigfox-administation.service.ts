import { SigFoxApiUsersResponseDto } from "@dto/sigfox/external/sigfox-api-users-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    BadRequestException,
    HttpException,
    HttpService,
    HttpStatus,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { ApiTooManyRequestsResponse } from "@nestjs/swagger";
import { AxiosRequestConfig, Method } from "axios";
import { ISetupCache, setupCache } from "axios-cache-adapter";

@Injectable()
export class GenericSigfoxAdministationService {
    constructor(private httpService: HttpService) {
        this.cache = setupCache({
            maxAge: 5 * 60 * 1000, // 5 minutes
        });
    }
    private cache: ISetupCache;

    BASE_URL = "https://api.sigfox.com/v2/";
    TIMEOUT_IN_MS = 30000;

    private readonly logger = new Logger(GenericSigfoxAdministationService.name);

    async get<T>(path: string, sigfoxGroup: SigFoxGroup, useCache?: boolean): Promise<T> {
        return await this.doRequest<T>({
            path: path,
            sigfoxGroup: sigfoxGroup,
            method: "GET",
            useCache,
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async post<T>(path: string, dto: any, sigfoxGroup: SigFoxGroup): Promise<T> {
        return await this.doRequest<T>({
            path: path,
            sigfoxGroup: sigfoxGroup,
            method: "POST",
            dto,
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async put<T>(path: string, dto: any, sigfoxGroup: SigFoxGroup): Promise<T> {
        return await this.doRequest<T>({
            path: path,
            sigfoxGroup: sigfoxGroup,
            method: "PUT",
            dto,
        });
    }

    async delete<T>(path: string, sigfoxGroup: SigFoxGroup): Promise<T> {
        return await this.doRequest<T>({
            path: path,
            sigfoxGroup: sigfoxGroup,
            method: "DELETE",
        });
    }

    async testConnection(sigfoxGroup: SigFoxGroup): Promise<boolean> {
        try {
            const apiUsers = await this.get<SigFoxApiUsersResponseDto>(
                "api-users",
                sigfoxGroup
            );
            return apiUsers.data.length > 0;
        } catch (err) {
            return false;
        }
    }

    private async doRequest<T>({
        path,
        sigfoxGroup,
        method,
        dto = {},
        useCache = false,
    }: RequestParameters): Promise<T> {
        const config = await this.generateAxiosConfig(
            sigfoxGroup,
            method,
            path,
            dto,
            useCache
        );
        try {
            const result = await this.httpService.request(config).toPromise();
            this.logger.debug(
                `${method} '${path}' got status: '${result.status} ${result.statusText}' `
            );
            return result.data;
        } catch (err) {
            this.handleError<T>(method, path, dto, err);
        }
    }

    private handleError<T>(method: string, path: string, dto: any, err: any) {
        this.logger.warn(
            `${method} '${path}'` + (dto != null ? `: '${JSON.stringify(dto)}'` : "")
        );
        const response = err?.response;
        if (response?.status == 401) {
            throw new UnauthorizedException(ErrorCodes.SIGFOX_BAD_LOGIN);
        }

        if (response?.status == 400) {
            this.logger.error(
                `Error from SigFox: ${JSON.stringify(response?.data?.errors)}`
            );
            throw new BadRequestException(response?.data?.errors);
        }

        this.handleSigFox429<T>(response);

        this.logger.error(
            `Got unexpected error from SigFox (${response?.status} ${response?.statusText})'`
        );
        throw err;
    }

    private handleSigFox429<T>(response: any) {
        if (response?.status == 429) {
            this.logger.error(
                `Request to '${response.request.method} ${response.request.path}' got 'Too many requsts' ...`
            );
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    error: "Too Many Requests",
                    message: "SigFox requests are limited. " + response.data.message,
                },
                429
            );
        }
    }

    private async generateAxiosConfig(
        sigfoxGroup: SigFoxGroup,
        method: Method,
        path: string,
        dto?: any,
        useCache?: boolean
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
        if (useCache) {
            axiosConfig.adapter = this.cache.adapter;
        }

        return axiosConfig;
    }

    private generateUrl(path: string): string {
        return `${this.BASE_URL}${path}`;
    }
}

interface RequestParameters {
    path: string;
    sigfoxGroup: SigFoxGroup;
    method: Method;
    dto?: any;
    useCache?: boolean;
}
